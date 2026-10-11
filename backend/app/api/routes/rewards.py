from __future__ import annotations

"""Rewards API — mint job status and claim endpoints.

GET  /rewards/my              — user's mint jobs (all statuses)
GET  /rewards/my/pending      — tokens the user has been whitelisted to claim
GET  /rewards/token/{token_id}/status/{wallet}  — on-chain claim status
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session
from app.chain.client import get_w3, rewards_contract
from app.models.nft import NFTMint
from app.models.user import User

router = APIRouter(prefix="/rewards", tags=["rewards"])


class MintOut(BaseModel):
    id: int
    token_id: int
    milestone_type: str
    strategy: str
    status: str
    transaction_hash: str | None
    on_chain_confirmed: bool

    model_config = {"from_attributes": True}


class ClaimStatusOut(BaseModel):
    wallet: str
    token_id: int
    whitelisted_on_chain: bool
    claimed_on_chain: bool


@router.get("/my", response_model=list[MintOut])
async def my_mints(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = (
        await session.execute(
            select(NFTMint)
            .where(NFTMint.user_id == current_user.id)
            .order_by(NFTMint.created_at.desc())
        )
    ).scalars().all()
    return rows


@router.get("/my/pending", response_model=list[MintOut])
async def my_pending_claims(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Tokens the user is whitelisted for but hasn't claimed yet."""
    rows = (
        await session.execute(
            select(NFTMint)
            .where(NFTMint.user_id == current_user.id, NFTMint.status == "whitelisted")
            .order_by(NFTMint.created_at.desc())
        )
    ).scalars().all()
    return rows


@router.get("/token/{token_id}/status/{wallet}", response_model=ClaimStatusOut)
async def claim_status(token_id: int, wallet: str):
    """Check live on-chain whitelist and claim status."""
    w3       = get_w3()
    contract = rewards_contract(w3)
    try:
        whitelisted = await contract.functions.isWhitelisted(wallet, token_id).call()
        claimed     = await contract.functions.hasClaimed(wallet, token_id).call()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chain read failed: {exc}") from exc
    return ClaimStatusOut(
        wallet=wallet,
        token_id=token_id,
        whitelisted_on_chain=whitelisted,
        claimed_on_chain=claimed,
    )
