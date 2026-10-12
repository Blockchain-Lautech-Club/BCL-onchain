from __future__ import annotations

import jwt
from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_session
from app.core.errors import AppError
from app.core.security import decode_session_token
from app.models import Role, User
from app.models.enums import RoleName, UserStatus


async def get_optional_user(request: Request, session: AsyncSession = Depends(get_session)) -> User | None:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        header = request.headers.get("authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:]
    if not token:
        return None
    try:
        payload = decode_session_token(token)
        user = await session.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, ValueError):
        return None
    if user is None or user.status != UserStatus.ACTIVE:
        return None
    return user


async def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise AppError(401, "unauthenticated", "Sign in with your wallet")
    return user


async def is_admin(session: AsyncSession, user: User) -> bool:
    wallet = (user.wallet_address or "").lower()
    if wallet and wallet in settings.bootstrap_admins:
        has_role = await session.scalar(
            select(Role.id).where(Role.user_id == user.id, Role.role == RoleName.ADMIN)
        )
        if not has_role:
            session.add(Role(user_id=user.id, role=RoleName.ADMIN))
            try:
                await session.commit()
            except Exception:
                await session.rollback()
        return True

    return bool(
        await session.scalar(
            select(Role.id).where(Role.user_id == user.id, Role.role == RoleName.ADMIN)
        )
    )


async def require_admin(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Role is checked against the DB on every request, never trusted from the token."""
    if not await is_admin(session, user):
        raise AppError(403, "forbidden", "Admin role required")
    return user