from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, is_admin
from app.core.config import settings
from app.core.db import get_session
from app.core.errors import AppError
from app.models import DomainRecord, NFTMint, Notification, PointsLedger, TaskSubmission, User
from app.schemas.profile import (DomainOut, LedgerOut, MintOut, NotificationOut, ProfileOut, ProfileUpdate)
from app.schemas.task import SubmissionOut
from app.services import level_service

router = APIRouter(prefix="/me", tags=["me"])


def mint_out(m: NFTMint) -> MintOut:
    out = MintOut.model_validate(m)
    out.explorer_url = settings.explorer_tx_url(m.transaction_hash)
    return out


@router.get("", response_model=ProfileOut)
async def profile(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    info = level_service.next_level_info(user.total_points, await level_service.get_thresholds(session))
    out = ProfileOut.model_validate(user)
    out.is_admin = await is_admin(session, user)
    out.next_level, out.next_level_threshold, out.points_to_next = (
        info["next_level"], info["next_level_threshold"], info["points_to_next"])
    return out


@router.patch("", response_model=ProfileOut)
async def update_profile(body: ProfileUpdate, user: User = Depends(get_current_user),
                         session: AsyncSession = Depends(get_session)):
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(409, "username_taken", "That username is taken")
    return await profile(user, session)


@router.get("/submissions", response_model=list[SubmissionOut])
async def my_submissions(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    q = select(TaskSubmission).where(TaskSubmission.user_id == user.id).order_by(TaskSubmission.id.desc()).limit(200)
    return (await session.execute(q)).scalars().all()


@router.get("/points", response_model=list[LedgerOut])
async def my_points(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    q = select(PointsLedger).where(PointsLedger.user_id == user.id).order_by(PointsLedger.id.desc()).limit(200)
    return (await session.execute(q)).scalars().all()


@router.get("/nfts", response_model=list[MintOut])
async def my_nfts(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    q = select(NFTMint).where(NFTMint.user_id == user.id).order_by(NFTMint.level)
    return [mint_out(m) for m in (await session.execute(q)).scalars().all()]


@router.get("/domains", response_model=list[DomainOut])
async def my_domains(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    q = select(DomainRecord).where(DomainRecord.owner_wallet == user.wallet_address)
    return (await session.execute(q)).scalars().all()


@router.get("/notifications", response_model=list[NotificationOut])
async def notifications(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    q = select(Notification).where(Notification.user_id == user.id).order_by(Notification.id.desc()).limit(100)
    return (await session.execute(q)).scalars().all()


@router.post("/notifications/read")
async def mark_read(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Notification).where(Notification.user_id == user.id, Notification.read.is_(False)))).scalars().all()
    for n in rows:
        n.read = True
    await session.commit()
    return {"updated": len(rows)}
