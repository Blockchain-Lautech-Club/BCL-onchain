from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, is_admin
from app.core.config import settings
from app.core.db import get_session
from app.core.security import create_session_token
from app.models import User
from app.schemas.auth import NonceRequest, NonceResponse, VerifyRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/nonce", response_model=NonceResponse)
async def nonce(body: NonceRequest, session: AsyncSession = Depends(get_session)):
    n, message = await auth_service.issue_nonce(session, body.address)
    return NonceResponse(nonce=n, message=message)


@router.post("/verify")
async def verify(body: VerifyRequest, response: Response, session: AsyncSession = Depends(get_session)):
    user = await auth_service.verify_login(session, body.address, body.signature)
    token = create_session_token(user.id, user.wallet_address)
    response.set_cookie(
        settings.cookie_name, token, max_age=settings.jwt_ttl_seconds, httponly=True,
        secure=settings.cookie_secure, samesite="lax", path="/",
    )
    return {"wallet_address": user.wallet_address, "is_admin": await is_admin(session, user), "token": token}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")
    return {"ok": True}


@router.get("/me")
async def me(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return {"id": user.id, "wallet_address": user.wallet_address, "is_admin": await is_admin(session, user)}
