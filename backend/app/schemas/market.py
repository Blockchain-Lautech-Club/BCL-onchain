from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MarketRewardBase(BaseModel):
    title: str
    description: str = ""
    category: str = "Merchandise & Swag"
    xp_cost: int = 1000
    badge: str = "Physical Swag"
    badge_color: str = "accent"
    meta_info: str | None = None
    image_url: str | None = None
    min_level: int = 1
    stock: int | None = None
    is_active: bool = True
    cta_label: str = "Redeem Now"


class MarketRewardCreate(MarketRewardBase):
    pass


class MarketRewardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    xp_cost: int | None = None
    badge: str | None = None
    badge_color: str | None = None
    meta_info: str | None = None
    image_url: str | None = None
    min_level: int | None = None
    stock: int | None = None
    is_active: bool | None = None
    cta_label: str | None = None


class MarketRewardOut(MarketRewardBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class MarketRedeemIn(BaseModel):
    reward_id: int


class MarketRedemptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reward_id: int | None
    reward_title: str
    xp_cost: int
    voucher_code: str
    status: str
    created_at: datetime
