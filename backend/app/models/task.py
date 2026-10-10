from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, JSONType, utcnow
from app.models.enums import SubmissionStatus, TaskStatus


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(48), default="general", index=True)
    points: Mapped[int]
    verification_type: Mapped[str] = mapped_column(String(24))
    requirements: Mapped[dict] = mapped_column(JSONType, default=dict)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    repeatable: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(String(16), default=TaskStatus.DRAFT, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    __table_args__ = (
        # A given on-chain tx can back a given task only once (replay protection).
        UniqueConstraint("task_id", "tx_hash", name="uq_submission_task_tx"),
        Index("ix_submission_user_task", "user_id", "task_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    wallet: Mapped[str] = mapped_column(String(42))
    evidence: Mapped[dict] = mapped_column(JSONType, default=dict)
    status: Mapped[str] = mapped_column(String(16), default=SubmissionStatus.SUBMITTED, index=True)
    verification_result: Mapped[dict] = mapped_column(JSONType, default=dict)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
