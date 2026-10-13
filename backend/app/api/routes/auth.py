from __future__ import annotations

import aiohttp
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, is_admin
from app.core.config import settings
from app.core.db import get_session
from app.core.errors import AppError
from app.core.security import create_session_token
from app.models import User
from app.schemas.auth import NonceRequest, NonceResponse, VerifyRequest
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Standard SIWE (external wallets) ─────────────────────────────────────────

@router.post("/nonce", response_model=NonceResponse)
async def nonce(body: NonceRequest, session: AsyncSession = Depends(get_session)):
    n, message = await auth_service.issue_nonce(session, body.address)
    return NonceResponse(nonce=n, message=message)


@router.post("/verify")
async def verify(
    body: VerifyRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    user  = await auth_service.verify_login(session, body.address, body.signature)
    token = create_session_token(user.id, user.wallet_address)
    _set_session_cookie(response, token)
    return {
        "wallet_address": user.wallet_address,
        "is_admin":       await is_admin(session, user),
        "token":          token,
    }


# ── Embedded-wallet / social login (custom wallet backend) ───────────────────

class WalletTokenRequest(BaseModel):
    wallet_token: str


@router.post("/wallet-token")
async def wallet_token_login(
    body:     WalletTokenRequest,
    response: Response,
    session:  AsyncSession = Depends(get_session),
):
    """
    Authenticate using a Bearer token issued by the custom embedded wallet
    backend.  Set WALLET_BACKEND_URL in the backend's environment to point
    at the wallet service, e.g.:
        WALLET_BACKEND_URL=https://wallet-infra-three.vercel.app
    """
    wallet_backend_url = getattr(settings, "wallet_backend_url", "")
    if not wallet_backend_url:
        raise AppError(500, "config_error", "WALLET_BACKEND_URL is not configured")

    async with aiohttp.ClientSession() as http:
        async with http.get(
            f"{wallet_backend_url.rstrip('/')}/wallet/me",
            headers={"Authorization": f"Bearer {body.wallet_token}"},
        ) as resp:
            try:
                data = await resp.json(content_type=None)
            except Exception:
                data = {}
            if resp.status != 200:
                detail = data.get("detail", "Invalid wallet token") if isinstance(data, dict) else "Invalid wallet token"
                raise AppError(401, "invalid_wallet_token", detail)
            wallet_data = data

    address = (wallet_data.get("address") or "").lower()
    if not address:
        raise AppError(500, "wallet_error", "Wallet backend returned no address")

    user  = await auth_service.get_or_create_user(session, address)
    token = create_session_token(user.id, user.wallet_address)
    _set_session_cookie(response, token)
    return {
        "wallet_address": user.wallet_address,
        "is_admin":       await is_admin(session, user),
        "token":          token,
    }

# ── Session management ────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")
    return {"ok": True}


@router.get("/me")
async def me(
    user:    User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return {
        "id":             user.id,
        "wallet_address": user.wallet_address,
        "is_admin":       await is_admin(session, user),
    }


# ── Internal helper ───────────────────────────────────────────────────────────

def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        settings.cookie_name,
        token,
        max_age=settings.jwt_ttl_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
