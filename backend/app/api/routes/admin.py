from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.core.db import get_session
from app.core.errors import AppError
from app.models import AuditLog, DailyQuiz, Event, LevelConfig, MarketReward, MarketRedemption, NFTMint, PointsLedger, Role, Task, TaskSubmission, User
from app.models.base import as_utc
from app.models.enums import MintStatus, RoleName, SubmissionStatus, TaskStatus
from app.schemas.admin import LevelConfigIn, PointsAdjustment, RoleChange
from app.schemas.event import EventCreate, EventOut, EventUpdate
from app.schemas.market import MarketRewardCreate, MarketRewardOut, MarketRewardUpdate
from app.schemas.quiz import DailyQuizCreate, DailyQuizOut, DailyQuizUpdate
from app.schemas.task import ReviewRequest, SubmissionOut, TaskCreate, TaskOut, TaskUpdate
from app.services import level_service, points_service, submission_service, task_service
from app.services.audit import log_action

# Every route in this router requires the admin role (checked in the DB per request).
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


async def _task_or_404(session: AsyncSession, task_id: int) -> Task:
    task = await session.get(Task, task_id)
    if task is None:
        raise AppError(404, "task_not_found", "Task not found")
    return task


# ---- tasks
@router.get("/tasks", response_model=list[TaskOut])
async def all_tasks(status: TaskStatus | None = None, session: AsyncSession = Depends(get_session)):
    q = select(Task).order_by(Task.id.desc())
    if status:
        q = q.where(Task.status == status)
    return (await session.execute(q)).scalars().all()


@router.post("/tasks", response_model=TaskOut, status_code=201)
async def create_task(body: TaskCreate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    data = body.model_dump(exclude={"publish"})
    data["deadline"] = task_service.parse_deadline(data["deadline"])
    task = await task_service.create_task(session, admin, data, body.publish)
    await session.commit()
    return task


@router.patch("/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, body: TaskUpdate, admin: User = Depends(require_admin),
                      session: AsyncSession = Depends(get_session)):
    task = await _task_or_404(session, task_id)
    changes = body.model_dump(exclude_unset=True)
    if "deadline" in changes:
        changes["deadline"] = task_service.parse_deadline(changes["deadline"])
    task = await task_service.update_task(session, admin, task, changes)
    await session.commit()
    return task


@router.post("/tasks/{task_id}/publish", response_model=TaskOut)
async def publish_task(task_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    task = await task_service.set_status(session, admin, await _task_or_404(session, task_id), TaskStatus.PUBLISHED)
    await session.commit()
    return task


@router.post("/tasks/{task_id}/archive", response_model=TaskOut)
async def archive_task(task_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    task = await task_service.set_status(session, admin, await _task_or_404(session, task_id), TaskStatus.ARCHIVED)
    await session.commit()
    return task


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    task = await _task_or_404(session, task_id)
    # Unlink nullable points ledger references
    await session.execute(update(PointsLedger).where(PointsLedger.source_task_id == task.id).values(source_task_id=None))
    # Delete associated task submissions
    await session.execute(delete(TaskSubmission).where(TaskSubmission.task_id == task.id))
    # Delete the task
    task_title = task.title
    await session.delete(task)
    await log_action(session, admin, "task.delete", "task", task_id, {"title": task_title})
    await session.commit()
    return {"ok": True, "deleted_id": task_id, "title": task_title}



# ---- submissions / manual review
@router.get("/submissions", response_model=list[SubmissionOut])
async def submissions(status: SubmissionStatus = SubmissionStatus.UNDER_REVIEW, limit: int = Query(100, le=500),
                      session: AsyncSession = Depends(get_session)):
    q = (
        select(TaskSubmission, User.username, User.wallet_address, Task.title)
        .outerjoin(User, TaskSubmission.user_id == User.id)
        .outerjoin(Task, TaskSubmission.task_id == Task.id)
        .where(TaskSubmission.status == status)
        .order_by(TaskSubmission.id)
        .limit(limit)
    )
    rows = (await session.execute(q)).all()
    out = []
    for sub, username, wallet_address, task_title in rows:
        item = SubmissionOut.model_validate(sub)
        item.username = username
        item.wallet = sub.wallet or wallet_address
        item.task_title = task_title
        out.append(item)
    return out


@router.post("/submissions/{submission_id}/review", response_model=SubmissionOut)
async def review(submission_id: int, body: ReviewRequest, admin: User = Depends(require_admin),
                 session: AsyncSession = Depends(get_session)):
    return await submission_service.review(session, admin, submission_id, body.approve, body.reason)


# ---- levels
@router.get("/levels")
async def get_levels(session: AsyncSession = Depends(get_session)):
    return [{"level": l, "threshold": t} for l, t in await level_service.get_thresholds(session)]


@router.put("/levels")
async def put_levels(body: LevelConfigIn, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    items = sorted(body.levels, key=lambda i: i.level)
    if [i.level for i in items] != list(range(1, len(items) + 1)):
        raise AppError(422, "invalid_levels", "Levels must be contiguous starting at 1")
    if any(b.threshold <= a.threshold for a, b in zip(items, items[1:])):
        raise AppError(422, "invalid_levels", "Thresholds must be strictly increasing")
    await session.execute(delete(LevelConfig))
    session.add_all(LevelConfig(level=i.level, threshold=i.threshold) for i in items)
    await log_action(session, admin, "levels.replace", "level_config", "all", {"levels": [i.model_dump() for i in items]})
    await session.commit()
    return {"updated": len(items)}


@router.post("/levels/recalculate")
async def recalc(admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    """Apply current thresholds to all users (e.g. after lowering a threshold). Queues missing mints only."""
    ids = (await session.execute(select(User.id).where(User.total_points > 0))).scalars().all()
    changed = 0
    for uid in ids:
        user = (await session.execute(select(User).where(User.id == uid).with_for_update())).scalar_one()
        if await level_service.sync_user_level(session, user) is not None:
            changed += 1
    await log_action(session, admin, "levels.recalculate", "level_config", "all", {"changed": changed})
    await session.commit()
    return {"changed": changed}


# ---- users / roles / points
@router.get("/users")
async def users(q: str | None = None, limit: int = Query(50, le=200), session: AsyncSession = Depends(get_session)):
    stmt = select(User).order_by(User.id.desc()).limit(limit)
    if q:
        stmt = stmt.where(User.wallet_address.ilike(f"%{q.lower()}%") | User.username.ilike(f"%{q}%"))
    return [{"id": u.id, "wallet_address": u.wallet_address, "username": u.username, "status": u.status,
             "total_points": u.total_points, "level": u.level} for u in (await session.execute(stmt)).scalars().all()]


@router.post("/users/{user_id}/role")
async def change_role(user_id: int, body: RoleChange, admin: User = Depends(require_admin),
                      session: AsyncSession = Depends(get_session)):
    target = await session.get(User, user_id)
    if target is None:
        raise AppError(404, "user_not_found", "User not found")
    existing = await session.scalar(select(Role).where(Role.user_id == user_id, Role.role == body.role))
    if body.grant and not existing:
        session.add(Role(user_id=user_id, role=body.role, granted_by=admin.id))
    elif not body.grant and existing:
        if target.id == admin.id:
            raise AppError(409, "self_demotion", "Ask another admin to remove your role")
        await session.delete(existing)
    await log_action(session, admin, "role.grant" if body.grant else "role.revoke", "user", user_id, {"role": body.role})
    await session.commit()
    return {"user_id": user_id, "role": body.role, "granted": body.grant}


@router.post("/users/{user_id}/suspend")
async def suspend(user_id: int, suspend: bool = True, admin: User = Depends(require_admin),
                  session: AsyncSession = Depends(get_session)):
    target = await session.get(User, user_id)
    if target is None:
        raise AppError(404, "user_not_found", "User not found")
    target.status = "suspended" if suspend else "active"
    await log_action(session, admin, "user.suspend" if suspend else "user.unsuspend", "user", user_id)
    await session.commit()
    return {"user_id": user_id, "status": target.status}


@router.post("/points/adjust")
async def adjust(body: PointsAdjustment, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    if await session.get(User, body.user_id) is None:
        raise AppError(404, "user_not_found", "User not found")
    entry = await points_service.adjust_points(session, admin, body.user_id, body.delta, body.reason)
    await log_action(session, admin, "points.adjust", "user", body.user_id, {"delta": body.delta, "reason": body.reason})
    await session.commit()
    return {"ledger_id": entry.id}


# ---- mints
@router.get("/mints")
async def mints(status: MintStatus | None = None, limit: int = Query(100, le=500), session: AsyncSession = Depends(get_session)):
    stmt = select(NFTMint).order_by(NFTMint.id.desc()).limit(limit)
    if status:
        stmt = stmt.where(NFTMint.status == status)
    return [{"id": m.id, "wallet": m.wallet, "level": m.level, "status": m.status, "tx": m.transaction_hash,
             "token_id": m.token_id, "retry_count": m.retry_count, "failure_reason": m.failure_reason}
            for m in (await session.execute(stmt)).scalars().all()]


@router.post("/mints/{mint_id}/retry")
async def retry_mint(mint_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    """Safe: the worker checks on-chain state first and the contract rejects duplicates."""
    mint = (await session.execute(select(NFTMint).where(NFTMint.id == mint_id).with_for_update())).scalar_one_or_none()
    if mint is None:
        raise AppError(404, "mint_not_found", "Mint job not found")
    if mint.status != MintStatus.FAILED:
        raise AppError(409, "not_failed", "Only failed mints can be retried")
    mint.status, mint.retry_count, mint.next_attempt_at = MintStatus.QUEUED, 0, None
    await log_action(session, admin, "mint.retry", "nft_mint", mint_id)
    await session.commit()
    return {"id": mint.id, "status": mint.status}


# ---- audit
@router.get("/audit-logs")
async def audit_logs(limit: int = Query(100, le=500), session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(AuditLog).order_by(AuditLog.id.desc()).limit(limit))).scalars().all()
    return [{"id": r.id, "actor": r.actor_wallet, "action": r.action, "target": f"{r.target_type}:{r.target_id}",
             "meta": r.meta, "created_at": r.created_at} for r in rows]


# ---- daily quizzes
@router.get("/quizzes", response_model=list[DailyQuizOut])
async def list_quizzes(limit: int = Query(50, le=200), session: AsyncSession = Depends(get_session)):
    stmt = select(DailyQuiz).order_by(DailyQuiz.id.desc()).limit(limit)
    return (await session.execute(stmt)).scalars().all()


@router.post("/quizzes", response_model=DailyQuizOut, status_code=201)
async def create_quiz(body: DailyQuizCreate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    quiz = DailyQuiz(
        quiz_date=body.quiz_date,
        title=body.title,
        topic=body.topic,
        description=body.description,
        question=body.question,
        options=[opt.model_dump() for opt in body.options],
        correct_index=body.correct_index,
        explanation=body.explanation,
        points=body.points,
        is_active=body.is_active,
    )
    session.add(quiz)
    await session.flush()
    await log_action(session, admin, "quiz.create", "daily_quiz", quiz.id, {"title": quiz.title, "date": quiz.quiz_date})
    await session.commit()
    return quiz


@router.patch("/quizzes/{quiz_id}", response_model=DailyQuizOut)
async def update_quiz(quiz_id: int, body: DailyQuizUpdate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    quiz = await session.get(DailyQuiz, quiz_id)
    if quiz is None:
        raise AppError(404, "quiz_not_found", "Quiz not found")
    data = body.model_dump(exclude_unset=True)
    if "options" in data and data["options"] is not None:
        data["options"] = [opt.model_dump() if hasattr(opt, "model_dump") else opt for opt in data["options"]]
    for k, v in data.items():
        setattr(quiz, k, v)
    await log_action(session, admin, "quiz.update", "daily_quiz", quiz_id, data)
    await session.commit()
    return quiz


@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    quiz = await session.get(DailyQuiz, quiz_id)
    if quiz is None:
        raise AppError(404, "quiz_not_found", "Quiz not found")
    await session.delete(quiz)
    await log_action(session, admin, "quiz.delete", "daily_quiz", quiz_id)
    await session.commit()
    return {"ok": True, "deleted": quiz_id}


# ---- community events & x spaces
@router.post("/events", response_model=EventOut, status_code=201)
async def create_event(body: EventCreate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    event = Event(
        title=body.title,
        description=body.description,
        event_type=body.event_type,
        mode=body.mode,
        location_url=body.location_url,
        event_date=as_utc(body.event_date),
        xp_reward=body.xp_reward,
        is_live=body.is_live,
        status=body.status,
        created_by=admin.id,
    )
    session.add(event)
    await session.flush()
    await log_action(session, admin, "event.create", "event", event.id, {"title": event.title})
    await session.commit()
    return event


@router.patch("/events/{event_id}", response_model=EventOut)
async def update_event(event_id: int, body: EventUpdate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    event = await session.get(Event, event_id)
    if event is None:
        raise AppError(404, "event_not_found", "Event not found")
    data = body.model_dump(exclude_unset=True)
    if "event_date" in data and data["event_date"] is not None:
        data["event_date"] = as_utc(data["event_date"])
    for k, v in data.items():
        setattr(event, k, v)
    await log_action(session, admin, "event.update", "event", event_id, data)
    await session.commit()
    return event


@router.delete("/events/{event_id}")
async def delete_event(event_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    event = await session.get(Event, event_id)
    if event is None:
        raise AppError(404, "event_not_found", "Event not found")
    await session.delete(event)
    await log_action(session, admin, "event.delete", "event", event_id)
    await session.commit()
    return {"ok": True, "deleted": event_id}


# ---- market rewards
@router.get("/market/rewards", response_model=list[MarketRewardOut])
async def admin_list_market_rewards(session: AsyncSession = Depends(get_session)):
    stmt = select(MarketReward).order_by(MarketReward.id.asc())
    return (await session.execute(stmt)).scalars().all()


@router.post("/market/rewards", response_model=MarketRewardOut, status_code=201)
async def admin_create_market_reward(body: MarketRewardCreate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    reward = MarketReward(**body.model_dump())
    session.add(reward)
    await session.flush()
    await log_action(session, admin, "market_reward.create", "market_reward", reward.id, {"title": reward.title})
    await session.commit()
    return reward


@router.patch("/market/rewards/{reward_id}", response_model=MarketRewardOut)
async def admin_update_market_reward(reward_id: int, body: MarketRewardUpdate, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    reward = await session.get(MarketReward, reward_id)
    if reward is None:
        raise AppError(404, "reward_not_found", "Market reward not found")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(reward, k, v)
    await log_action(session, admin, "market_reward.update", "market_reward", reward_id, data)
    await session.commit()
    return reward


@router.delete("/market/rewards/{reward_id}")
async def admin_delete_market_reward(reward_id: int, admin: User = Depends(require_admin), session: AsyncSession = Depends(get_session)):
    reward = await session.get(MarketReward, reward_id)
    if reward is None:
        raise AppError(404, "reward_not_found", "Market reward not found")
    await session.delete(reward)
    await log_action(session, admin, "market_reward.delete", "market_reward", reward_id)
    await session.commit()
    return {"ok": True, "deleted": reward_id}



