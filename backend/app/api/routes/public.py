from __future__ import annotations

from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import cast, Date as SADate, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import is_admin
from app.api.routes.me import mint_out
from app.core.db import get_session
from app.core.errors import AppError
from app.models import DailyQuiz, DomainRecord, NFTMint, PointsLedger, TaskSubmission, User
from app.models.base import as_utc, utcnow
from app.schemas.profile import DomainOut, LeaderboardEntry, LedgerOut, MintOut, ProfileOut
from app.services import auth_service, domain_service, level_service

router = APIRouter(tags=["public"])


async def compute_user_stats(session: AsyncSession, user: User) -> dict:
    from datetime import datetime, timezone, timedelta
    thresholds = await level_service.get_thresholds(session)
    info = level_service.next_level_info(user.total_points, thresholds)

    completed_q = select(func.count()).where(
        TaskSubmission.user_id == user.id,
        TaskSubmission.status == "verified",
    )
    completed_tasks_count = (await session.execute(completed_q)).scalar() or 0

    active_names_q = select(func.count()).where(
        DomainRecord.owner_wallet == user.wallet_address,
        DomainRecord.status == "active",
    )
    active_names_count = (await session.execute(active_names_q)).scalar() or 0

    today_utc = datetime.now(timezone.utc).date()
    today_str = today_utc.isoformat()

    daily_key = f"daily:{user.id}:{today_str}"
    quiz_key = f"quiz:{user.id}:{today_str}"

    daily_claimed = bool(await session.scalar(select(PointsLedger.id).where(PointsLedger.idempotency_key == daily_key)))
    quiz_claimed = bool(await session.scalar(select(PointsLedger.id).where(PointsLedger.idempotency_key == quiz_key)))

    dates_q = (
        select(cast(PointsLedger.created_at, SADate).label("day"))
        .where(PointsLedger.user_id == user.id)
        .distinct()
        .order_by(cast(PointsLedger.created_at, SADate).desc())
        .limit(365)
    )
    rows = (await session.execute(dates_q)).scalars().all()
    active_dates = [d.isoformat() for d in rows[:30]]

    streak_days = 0
    expected = today_utc
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
        "daily_claimed": daily_claimed,
        "quiz_claimed": quiz_claimed,
        "today": today_str,
        "active_dates": active_dates,
    }


@router.get("/health")
async def health():
    try:
        from app.core.db import SessionLocal
        from sqlalchemy import text
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e), "type": type(e).__name__}


@router.get("/daily-quiz")
async def get_daily_quiz(session: AsyncSession = Depends(get_session)):
    """Fetch today's active daily quiz set by admin. Falls back to latest active quiz or seeds default."""
    from datetime import datetime, timezone
    today_str = datetime.now(timezone.utc).date().isoformat()

    try:
        # 1. Check if table exists / query active quiz for today
        stmt = (
            select(DailyQuiz)
            .where(DailyQuiz.quiz_date == today_str, DailyQuiz.is_active.is_(True))
            .order_by(DailyQuiz.id.desc())
            .limit(1)
        )
        quiz = (await session.execute(stmt)).scalar_one_or_none()

        # 2. If not found for today, query most recent active quiz set by admin
        if not quiz:
            stmt = (
                select(DailyQuiz)
                .where(DailyQuiz.is_active.is_(True))
                .order_by(DailyQuiz.id.desc())
                .limit(1)
            )
            quiz = (await session.execute(stmt)).scalar_one_or_none()

        # 3. If none exists, seed initial quiz
        if not quiz:
            quiz = DailyQuiz(
                quiz_date=today_str,
                title="Smart Contract Reentrancy Basics: Detection & Prevention",
                topic="Smart Contract Security",
                description="Test your understanding of Checks-Effects-Interactions pattern, mutex guards, and fallback vulnerability surfaces.",
                question="Which design pattern or guard is considered the canonical standard in Solidity to safely prevent recursive external reentrancy exploits?",
                options=[
                    {"id": 0, "text": "Checks-Effects-Interactions (CEI) pattern + OpenZeppelin ReentrancyGuard"},
                    {"id": 1, "text": "Using tx.origin == msg.sender verification"},
                    {"id": 2, "text": "Transferring ETH before deducting user internal balance"},
                    {"id": 3, "text": "Using call() with unlimited gas forwarded to arbitrary addresses"},
                ],
                correct_index=0,
                explanation="The Checks-Effects-Interactions (CEI) pattern ensures internal state variables are updated before invoking external untrusted contracts, eliminating recursive reentrancy attacks.",
                points=50,
                is_active=True,
            )
            session.add(quiz)
            await session.commit()

        return {
            "id": quiz.id,
            "quiz_date": quiz.quiz_date,
            "title": quiz.title,
            "topic": quiz.topic,
            "description": quiz.description,
            "question": quiz.question,
            "options": quiz.options,
            "points": quiz.points,
            "is_active": quiz.is_active,
        }
    except Exception:
        # Fallback in case of database table synchronization
        return {
            "id": 1,
            "quiz_date": today_str,
            "title": "Smart Contract Reentrancy Basics: Detection & Prevention",
            "topic": "Smart Contract Security",
            "description": "Test your understanding of Checks-Effects-Interactions pattern, mutex guards, and fallback vulnerability surfaces.",
            "question": "Which design pattern or guard is considered the canonical standard in Solidity to safely prevent recursive external reentrancy exploits?",
            "options": [
                {"id": 0, "text": "Checks-Effects-Interactions (CEI) pattern + OpenZeppelin ReentrancyGuard"},
                {"id": 1, "text": "Using tx.origin == msg.sender verification"},
                {"id": 2, "text": "Transferring ETH before deducting user internal balance"},
                {"id": 3, "text": "Using call() with unlimited gas forwarded to arbitrary addresses"},
            ],
            "points": 50,
            "is_active": True,
        }


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                      session: AsyncSession = Depends(get_session)):
    try:
        # Select explicit columns so rows are plain values and never trigger ORM lazy-loading
        q = (select(User.wallet_address, User.username, User.avatar_url, User.total_points, User.level)
             .where(User.status == "active", User.total_points > 0)
             .order_by(User.total_points.desc(), User.id).limit(limit).offset(offset))
        user_rows = (await session.execute(q)).all()

        domain_map: dict[str, str] = {}
        if user_rows:
            wallets = [r.wallet_address.lower() for r in user_rows]
            try:
                domains_q = select(DomainRecord.owner_wallet, DomainRecord.normalized_name).where(
                    DomainRecord.owner_wallet.in_(wallets),
                    DomainRecord.status == "active"
                )
                domain_rows = (await session.execute(domains_q)).all()
                domain_map = {d[0].lower(): d[1] for d in domain_rows}
            except Exception:
                pass

        return [LeaderboardEntry(
            rank=offset + i + 1,
            wallet_address=r.wallet_address,
            username=domain_map.get(r.wallet_address.lower()) or r.username or f"{r.wallet_address[:6]}…{r.wallet_address[-4:]}",
            bcl_domain=domain_map.get(r.wallet_address.lower()),
            avatar_url=r.avatar_url,
            total_points=r.total_points,
            level=r.level,
        ) for i, r in enumerate(user_rows)]
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        raise AppError(500, "leaderboard_error", f"Leaderboard retrieval failed: {e} | {tb}")


@router.get("/users/{wallet}/nfts", response_model=list[MintOut])
async def user_nfts(wallet: str, session: AsyncSession = Depends(get_session)):
    wallet = auth_service.normalize_address(wallet)
    q = select(NFTMint).where(NFTMint.wallet == wallet, NFTMint.status == "confirmed").order_by(NFTMint.level)
    return [mint_out(m) for m in (await session.execute(q)).scalars().all()]


@router.get("/users/{wallet}/profile", response_model=ProfileOut)
async def user_profile(wallet: str, session: AsyncSession = Depends(get_session)):
    wallet = auth_service.normalize_address(wallet)
    user = await session.scalar(select(User).where(User.wallet_address == wallet))
    if user is None:
        raise AppError(404, "user_not_found", "User not found")
    thresholds = await level_service.get_thresholds(session)
    info = level_service.next_level_info(user.total_points, thresholds)
    out = ProfileOut.model_validate(user)
    out.is_admin = await is_admin(session, user)
    out.next_level, out.next_level_threshold, out.points_to_next = (
        info["next_level"], info["next_level_threshold"], info["points_to_next"]
    )
    return out


@router.get("/users/{wallet}/stats")
async def user_stats(wallet: str, session: AsyncSession = Depends(get_session)):
    wallet = auth_service.normalize_address(wallet)
    user = await session.scalar(select(User).where(User.wallet_address == wallet))
    if user is None:
        raise AppError(404, "user_not_found", "User not found")
    return await compute_user_stats(session, user)


@router.get("/users/{wallet}/points", response_model=list[LedgerOut])
async def user_points(wallet: str, session: AsyncSession = Depends(get_session)):
    wallet = auth_service.normalize_address(wallet)
    user = await session.scalar(select(User).where(User.wallet_address == wallet))
    if user is None:
        return []
    q = (select(PointsLedger)
         .where(PointsLedger.user_id == user.id)
         .order_by(PointsLedger.created_at.desc())
         .limit(100))
    return [LedgerOut.model_validate(r) for r in (await session.execute(q)).scalars().all()]


@router.get("/users/{wallet}/domains", response_model=list[DomainOut])
async def user_domains(wallet: str, session: AsyncSession = Depends(get_session)):
    wallet = auth_service.normalize_address(wallet)
    q = select(DomainRecord).where(DomainRecord.owner_wallet == wallet, DomainRecord.status == "active")
    return [DomainOut.model_validate(r) for r in (await session.execute(q)).scalars().all()]


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
