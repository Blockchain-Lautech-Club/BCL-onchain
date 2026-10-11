from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Notification


async def notify(session: AsyncSession, user_id: int, kind: str, message: str, data: dict | None = None) -> None:
    session.add(Notification(user_id=user_id, kind=kind, message=message, data=data or {}))
