from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_user
from app.core.db import get_session
from app.core.errors import AppError
from app.models import Task, User
from app.models.enums import TaskStatus
from app.schemas.task import SubmissionOut, SubmitRequest, TaskOut
from app.services import submission_service, task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _out(task: Task, state: str | None) -> TaskOut:
    out = TaskOut.model_validate(task)
    out.my_state = state
    return out


@router.get("", response_model=list[TaskOut])
async def list_tasks(category: str | None = None, session: AsyncSession = Depends(get_session),
                     user: User | None = Depends(get_optional_user)):
    q = select(Task).where(Task.status == TaskStatus.PUBLISHED).order_by(Task.id.desc())
    if category:
        q = q.where(Task.category == category)
    tasks = (await session.execute(q)).scalars().all()
    states = await task_service.user_task_states(session, user, tasks)
    return [_out(t, states[t.id] if user else None) for t in tasks]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, session: AsyncSession = Depends(get_session),
                   user: User | None = Depends(get_optional_user)):
    task = await session.get(Task, task_id)
    if task is None or task.status != TaskStatus.PUBLISHED:
        raise AppError(404, "task_not_found", "Task not found")
    states = await task_service.user_task_states(session, user, [task])
    return _out(task, states[task.id] if user else None)


@router.post("/{task_id}/submit", response_model=SubmissionOut)
async def submit_task(task_id: int, body: SubmitRequest, session: AsyncSession = Depends(get_session),
                      user: User = Depends(get_current_user)):
    return await submission_service.submit(session, user, task_id, body.evidence)
