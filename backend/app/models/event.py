from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    event_type: Mapped[str] = mapped_column(String(60), default="Workshop")  # Workshop, Hackathon, X Space, Seminar, Meetup, Onboarding
    mode: Mapped[str] = mapped_column(String(100), default="Online · X Spaces")  # Online · X Spaces, Hybrid, Campus Lab, Discord Stage
    location_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # URL or physical venue
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=100)
    registered_count: Mapped[int] = mapped_column(Integer, default=0)
    is_live: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="upcoming")  # upcoming, live, concluded, cancelled
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    wallet_address: Mapped[str] = mapped_column(String(42), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
