from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class MarketReward(Base):
    __tablename__ = "market_rewards"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), default="Merchandise & Swag")
    xp_cost: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    badge: Mapped[str] = mapped_column(String(60), default="Physical Swag")
    badge_color: Mapped[str] = mapped_column(String(40), default="accent")
    meta_info: Mapped[str | None] = mapped_column(String(200), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_level: Mapped[int] = mapped_column(Integer, default=1)
    stock: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    cta_label: Mapped[str] = mapped_column(String(60), default="Redeem Now")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class MarketRedemption(Base):
    __tablename__ = "market_redemptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    reward_id: Mapped[int | None] = mapped_column(ForeignKey("market_rewards.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    wallet_address: Mapped[str] = mapped_column(String(42), nullable=False)
    reward_title: Mapped[str] = mapped_column(String(250), nullable=False)
    xp_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    voucher_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="redeemed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
