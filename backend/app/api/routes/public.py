from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.me import mint_out
from app.core.db import get_session
from app.core.errors import AppError
from app.models import DomainRecord, NFTMint, User
from app.models.base import as_utc, utcnow
from app.schemas.profile import DomainOut, LeaderboardEntry, MintOut
from app.services import auth_service, domain_service

router = APIRouter(tags=["public"])


@router.get("/health")
async def health(session: AsyncSession = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                      session: AsyncSession = Depends(get_session)):
    q = (select(User).where(User.status == "active", User.total_points > 0)
         .order_by(User.total_points.desc(), User.id).limit(limit).offset(offset))
    users = (await session.execute(q)).scalars().all()
    return [LeaderboardEntry(rank=offset + i + 1, wallet_address=u.wallet_address, username=u.username,
                             total_points=u.total_points, level=u.level) for i, u in enumerate(users)]


@router.get("/users/{wallet}/nfts", response_model=list[MintOut])
async def user_nfts(wallet: str, session: AsyncSession = Depends(get_session)):
    wallet = auth_service.normalize_address(wallet)
    q = select(NFTMint).where(NFTMint.wallet == wallet, NFTMint.status == "confirmed").order_by(NFTMint.level)
    return [mint_out(m) for m in (await session.execute(q)).scalars().all()]


@router.get("/domains/availability")
async def availability(name: str):
    label = domain_service.normalize_label(name)
    return await domain_service.check_availability(label)


@router.get("/domains/quote")
async def quote(name: str, years: int = Query(1, ge=1, le=10)):
    label = domain_service.normalize_label(name)
    return await domain_service.build_register_quote(label, years)


@router.get("/domains/resolve/{name}")
async def resolve(name: str, session: AsyncSession = Depends(get_session)):
    """In-app resolution from the indexed registry. .bcl does not resolve in browsers/public DNS."""
    label = domain_service.normalize_label(name)
    rec = await session.scalar(select(DomainRecord).where(DomainRecord.normalized_name == f"{label}.bcl"))
    if rec is None or rec.status != "active" or as_utc(rec.expires_at) <= utcnow():
        raise AppError(404, "name_not_found", "Name is not registered")
    return DomainOut.model_validate(rec)
