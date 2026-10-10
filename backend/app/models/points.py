from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class PointsLedger(Base):
    """Append-only. Never UPDATE or DELETE rows; corrections are new rows with a reason."""

    __tablename__ = "points_ledger"
    __table_args__ = (Index("ix_ledger_user_created", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    wallet: Mapped[str] = mapped_column(String(42))
    source_task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"), nullable=True)
    submission_id: Mapped[int | None] = mapped_column(ForeignKey("task_submissions.id"), nullable=True)
    points_delta: Mapped[int] = mapped_column(BigInteger)
    reason: Mapped[str] = mapped_column(Text)
    # Enforces exactly-once awards: "task:{task}:user:{user}" (or ":submission:{id}" if repeatable).
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)  # set for admin adjustments
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class LevelConfig(Base):
    __tablename__ = "level_config"

    level: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
    threshold: Mapped[int] = mapped_column(BigInteger, unique=True)  # total points required


class LevelHistory(Base):
    __tablename__ = "level_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    old_level: Mapped[int]
    new_level: Mapped[int]
    achieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
