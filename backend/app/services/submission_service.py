from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models import Task, TaskSubmission, User
from app.models.base import utcnow
from app.models.enums import SubmissionStatus, TaskStatus
from app.services import points_service
from app.services.audit import log_action
from app.services.notifications import notify
from app.services.task_service import is_expired
from app.services.verification import get_verifier


async def submit(session: AsyncSession, user: User, task_id: int, evidence: dict) -> TaskSubmission:
    task = await session.get(Task, task_id)
    if task is None or task.status != TaskStatus.PUBLISHED:
        raise AppError(404, "task_not_found", "Task not found")
    if is_expired(task):
        raise AppError(409, "task_expired", "This task has expired")

    prior = (
        await session.execute(
            select(TaskSubmission.status).where(TaskSubmission.task_id == task.id, TaskSubmission.user_id == user.id)
        )
    ).scalars().all()
    if SubmissionStatus.UNDER_REVIEW in prior:
        raise AppError(409, "already_pending", "You already have a submission awaiting review")
    if not task.repeatable and SubmissionStatus.VERIFIED in prior:
        raise AppError(409, "already_completed", "You already completed this task")

    sub = TaskSubmission(task_id=task.id, user_id=user.id, wallet=user.wallet_address, evidence=evidence,
                         status=SubmissionStatus.SUBMITTED)
    session.add(sub)
    await session.flush()

    # Verification runs server-side only; browser-supplied status is ignored.
    result = await get_verifier(task.verification_type).verify(task, user, evidence)
    sub.verification_result = {"status": result.status, "reason": result.reason, **result.data}
    sub.reason = result.reason

    if result.status == "verified":
        await points_service.finalize_verified(session, sub, task)
    elif result.status == "under_review":
        sub.status = SubmissionStatus.UNDER_REVIEW
    else:
        sub.status = SubmissionStatus.REJECTED
        await notify(session, user.id, "task_rejected", f"Submission rejected: {task.title}",
                     {"task_id": task.id, "reason": result.reason})
    await session.commit()
    return sub


async def review(session: AsyncSession, admin: User, submission_id: int, approve: bool, reason: str | None) -> TaskSubmission:
    sub = (
        await session.execute(select(TaskSubmission).where(TaskSubmission.id == submission_id).with_for_update())
    ).scalar_one_or_none()
    if sub is None:
        raise AppError(404, "submission_not_found", "Submission not found")
    if sub.status != SubmissionStatus.UNDER_REVIEW:
        raise AppError(409, "not_reviewable", "Only submissions under review can be reviewed")
    task = await session.get(Task, sub.task_id)

    if approve:
        await points_service.finalize_verified(session, sub, task, verified_by=admin.id)
    else:
        sub.status = SubmissionStatus.REJECTED
        sub.reason = reason or "Rejected by reviewer"
        sub.verified_by = admin.id
        sub.verified_at = utcnow()
        await notify(session, sub.user_id, "task_rejected", f"Submission rejected: {task.title}",
                     {"task_id": task.id, "reason": sub.reason})
    await log_action(session, admin, "submission.approve" if approve else "submission.reject", "submission",
                     sub.id, {"task_id": task.id, "reason": reason})
    await session.commit()
    return sub
