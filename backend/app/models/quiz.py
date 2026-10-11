from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, JSONType, utcnow


class DailyQuiz(Base):
    __tablename__ = "daily_quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_date: Mapped[str] = mapped_column(String(20), index=True)  # YYYY-MM-DD
    title: Mapped[str] = mapped_column(String(250))
    topic: Mapped[str] = mapped_column(String(100), default="Web3 Security")
    description: Mapped[str] = mapped_column(Text, default="")
    question: Mapped[str] = mapped_column(Text)
    options: Mapped[list[dict]] = mapped_column(JSONType, default=list)  # [{"id": int, "text": str}]
    correct_index: Mapped[int] = mapped_column(Integer, default=0)
    explanation: Mapped[str] = mapped_column(Text, default="")
    points: Mapped[int] = mapped_column(Integer, default=50)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
