from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3

from app.core.errors import AppError
from app.models import Task, TaskSubmission, User
from app.models.base import as_utc, utcnow
from app.models.enums import SubmissionStatus, TaskStatus, UserTaskState, VerificationType
from app.services.audit import log_action


def validate_requirements(vtype: str, req: dict) -> None:
    if vtype in (VerificationType.ONCHAIN_TX, VerificationType.NFT_OWNERSHIP):
        addr = req.get("contract_address")
        if not addr or not Web3.is_address(addr):
            raise AppError(422, "invalid_requirements", "requirements.contract_address must be a valid address")
        selector = req.get("function_selector")
        if selector and not (isinstance(selector, str) and len(selector) == 10 and selector.startswith("0x")):
            raise AppError(422, "invalid_requirements", "function_selector must be a 4-byte hex string")


def is_expired(task: Task) -> bool:
    return task.deadline is not None and as_utc(task.deadline) < utcnow()


async def user_task_states(session: AsyncSession, user: User | None, tasks: list[Task]) -> dict[int, str]:
    states: dict[int, str] = {}
    latest: dict[int, str] = {}
    if user and tasks:
        rows = (
            await session.execute(
                select(TaskSubmission.task_id, TaskSubmission.status)
                .where(TaskSubmission.user_id == user.id, TaskSubmission.task_id.in_([t.id for t in tasks]))
                .order_by(TaskSubmission.id)
            )
        ).all()
        for task_id, status in rows:
            cur = latest.get(task_id)
            # Verified beats everything; otherwise the most recent submission wins.
            if cur == SubmissionStatus.VERIFIED and status != SubmissionStatus.VERIFIED:
                continue
            latest[task_id] = status
    for t in tasks:
        sub = latest.get(t.id)
        if sub:
            states[t.id] = {
                SubmissionStatus.VERIFIED: UserTaskState.VERIFIED,
                SubmissionStatus.UNDER_REVIEW: UserTaskState.UNDER_REVIEW,
                SubmissionStatus.SUBMITTED: UserTaskState.SUBMITTED,
                SubmissionStatus.REJECTED: UserTaskState.EXPIRED if is_expired(t) else UserTaskState.REJECTED,
            }[sub]
        else:
            states[t.id] = UserTaskState.EXPIRED if is_expired(t) else UserTaskState.NOT_STARTED
    return states


async def create_task(session: AsyncSession, admin: User, data: dict, publish: bool) -> Task:
    validate_requirements(data["verification_type"], data.get("requirements") or {})
    task = Task(**data, created_by=admin.id, status=TaskStatus.PUBLISHED if publish else TaskStatus.DRAFT)
    session.add(task)
    await session.flush()
    await log_action(session, admin, "task.create", "task", task.id, {"status": task.status})
    return task


async def update_task(session: AsyncSession, admin: User, task: Task, changes: dict) -> Task:
    vtype = changes.get("verification_type", task.verification_type)
    req = changes.get("requirements", task.requirements)
    validate_requirements(vtype, req or {})
    for k, v in changes.items():
        setattr(task, k, v)
    await log_action(session, admin, "task.update", "task", task.id, {"fields": sorted(changes)})
    return task


async def set_status(session: AsyncSession, admin: User, task: Task, status: TaskStatus) -> Task:
    task.status = status
    await log_action(session, admin, f"task.{status.value}", "task", task.id)
    return task


def parse_deadline(value: datetime | None) -> datetime | None:
    return as_utc(value)
