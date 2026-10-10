import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PointsLedger, Task, TaskSubmission, User
from app.models.base import utcnow
from app.models.enums import SubmissionStatus
from app.services import level_service
from app.services.notifications import notify


async def _lock_user(session: AsyncSession, user_id: int) -> User:
    return (await session.execute(select(User).where(User.id == user_id).with_for_update())).scalar_one()


def task_idempotency_key(task: Task, user_id: int, submission_id: int) -> str:
    if task.repeatable:
        return f"task:{task.id}:submission:{submission_id}"
    return f"task:{task.id}:user:{user_id}"


async def finalize_verified(
    session: AsyncSession, submission: TaskSubmission, task: Task, verified_by: int | None = None
) -> bool:
    """Mark a submission verified and award points exactly once. Returns True if points were newly awarded.

    Concurrency: serialised per user by the user-row lock; the unique idempotency_key is the final guard.
    """
    user = await _lock_user(session, submission.user_id)
    key = task_idempotency_key(task, user.id, submission.id)

    already = await session.scalar(select(PointsLedger.id).where(PointsLedger.idempotency_key == key))
    if already:
        submission.status = SubmissionStatus.REJECTED
        submission.reason = "Task already completed"
        return False

    try:
        async with session.begin_nested():
            session.add(
                PointsLedger(
                    user_id=user.id,
                    wallet=user.wallet_address,
                    source_task_id=task.id,
                    submission_id=submission.id,
                    points_delta=task.points,
                    reason=f"Task completed: {task.title}",
                    idempotency_key=key,
                )
            )
            await session.flush()
    except IntegrityError:
        submission.status = SubmissionStatus.REJECTED
        submission.reason = "Task already completed"
        return False

    submission.status = SubmissionStatus.VERIFIED
    submission.verified_by = verified_by
    submission.verified_at = utcnow()
    submission.tx_hash = (submission.evidence or {}).get("tx_hash")

    user.total_points += task.points
    await notify(session, user.id, "points_awarded", f"+{task.points} points: {task.title}",
                 {"task_id": task.id, "points": task.points})
    await level_service.sync_user_level(session, user)
    return True


async def adjust_points(session: AsyncSession, admin: User, user_id: int, delta: int, reason: str) -> PointsLedger:
    """Admin correction. Always a new ledger row; level is re-synced (no NFT revocation on decrease)."""
    user = await _lock_user(session, user_id)
    entry = PointsLedger(
        user_id=user.id,
        wallet=user.wallet_address,
        points_delta=delta,
        reason=f"Admin adjustment: {reason}",
        idempotency_key=f"adjust:{uuid.uuid4().hex}",
        created_by=admin.id,
    )
    session.add(entry)
    user.total_points += delta
    await level_service.sync_user_level(session, user)
    return entry
