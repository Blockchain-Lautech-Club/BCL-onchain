from fastapi import APIRouter, Depends
from sqlalchemy import func, select
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
from app.services.notifications import notify

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


@router.get("/stats")
async def my_stats(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    """Aggregated stats used by the dashboard and auth context."""
    thresholds = await level_service.get_thresholds(session)
    info = level_service.next_level_info(user.total_points, thresholds)

    # Count verified task submissions
    completed_q = select(func.count()).where(
        TaskSubmission.user_id == user.id,
        TaskSubmission.status == "verified",
    )
    completed_tasks_count = (await session.execute(completed_q)).scalar() or 0

    # Count active domain names
    active_names_q = select(func.count()).where(
        DomainRecord.owner_wallet == user.wallet_address,
        DomainRecord.status == "active",
    )
    active_names_count = (await session.execute(active_names_q)).scalar() or 0

    # Streak: count consecutive days with at least one verified submission or points reward, going back from today.
    from datetime import date, timedelta
    from sqlalchemy import cast, Date as SADate
    dates_q = (
        select(cast(PointsLedger.created_at, SADate).label("day"))
        .where(PointsLedger.user_id == user.id)
        .distinct()
        .order_by(cast(PointsLedger.created_at, SADate).desc())
        .limit(365)
    )
    rows = (await session.execute(dates_q)).scalars().all()
    streak_days = 0
    expected = date.today()
    for d in rows:
        if d == expected or d == expected - timedelta(days=1):
            streak_days += 1
            expected = d - timedelta(days=1)
        else:
            break

    return {
        "level": user.level,
        "total_points": user.total_points,
        "points_to_next_level": info["points_to_next"] or 0,
        "next_level_threshold": info["next_level_threshold"] or 0,
        "completed_tasks_count": completed_tasks_count,
        "active_names_count": active_names_count,
        "streak_days": streak_days,
    }


@router.post("/claim-daily")
async def claim_daily(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    """Claim daily streak 20 XP bonus. Enforced once per day via database idempotency key."""
    from datetime import date
    today_str = date.today().isoformat()
    key = f"daily:{user.id}:{today_str}"
    already = await session.scalar(select(PointsLedger.id).where(PointsLedger.idempotency_key == key))
    if already:
        raise AppError(409, "already_claimed", "Daily streak already claimed today")

    try:
        async with session.begin_nested():
            session.add(
                PointsLedger(
                    user_id=user.id,
                    wallet=user.wallet_address,
                    points_delta=20,
                    reason="Daily streak reward (+20 XP)",
                    idempotency_key=key,
                )
            )
            user.total_points += 20
            await session.flush()
    except IntegrityError:
        raise AppError(409, "already_claimed", "Daily streak already claimed today")

    await level_service.sync_user_level(session, user)
    await notify(session, user.id, "points_awarded", "+20 XP: Daily streak reward", {"points": 20})
    await session.commit()
    return {"ok": True, "points_delta": 20, "total_points": user.total_points, "level": user.level}


@router.post("/daily-quiz")
async def claim_quiz(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    """Claim daily web3 micro-quiz 50 XP bonus. Enforced once per day via database idempotency key."""
    from datetime import date
    today_str = date.today().isoformat()
    key = f"quiz:{user.id}:{today_str}"
    already = await session.scalar(select(PointsLedger.id).where(PointsLedger.idempotency_key == key))
    if already:
        raise AppError(409, "already_claimed", "Daily micro-quiz bonus already claimed today")

    try:
        async with session.begin_nested():
            session.add(
                PointsLedger(
                    user_id=user.id,
                    wallet=user.wallet_address,
                    points_delta=50,
                    reason="Daily Web3 Micro-Quiz (+50 XP)",
                    idempotency_key=key,
                )
            )
            user.total_points += 50
            await session.flush()
    except IntegrityError:
        raise AppError(409, "already_claimed", "Daily micro-quiz bonus already claimed today")

    await level_service.sync_user_level(session, user)
    await notify(session, user.id, "points_awarded", "+50 XP: Daily Web3 Micro-Quiz", {"points": 50})
    await session.commit()
    return {"ok": True, "points_delta": 50, "total_points": user.total_points, "level": user.level}


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
    q = select(NFTMint).where(NFTMint.user_id == user.id).order_by(NFTMint.id.desc())
    return [mint_out(m) for m in (await session.execute(q)).scalars().all()]


@router.get("/names", response_model=list[DomainOut])
@router.get("/domains", response_model=list[DomainOut])
async def my_names(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
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
