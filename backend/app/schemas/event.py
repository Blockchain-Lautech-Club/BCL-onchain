from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EventBase(BaseModel):
    title: str = Field(min_length=3, max_length=250)
    description: str = Field(default="", max_length=5000)
    event_type: str = Field(default="Workshop", max_length=60)
    mode: str = Field(default="Online · X Spaces", max_length=100)
    location_url: str | None = Field(default=None, max_length=500)
    event_date: datetime
    xp_reward: int = Field(default=100, ge=0, le=5000)
    is_live: bool = False
    status: str = Field(default="upcoming", max_length=30)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=250)
    description: str | None = Field(default=None, max_length=5000)
    event_type: str | None = Field(default=None, max_length=60)
    mode: str | None = Field(default=None, max_length=100)
    location_url: str | None = Field(default=None, max_length=500)
    event_date: datetime | None = None
    xp_reward: int | None = Field(default=None, ge=0, le=5000)
    is_live: bool | None = None
    status: str | None = Field(default=None, max_length=30)


class EventOut(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    registered_count: int = 0
    is_rsvpd: bool | None = None
    created_at: datetime
    updated_at: datetime


class EventRSVPOut(BaseModel):
    ok: bool
    event_id: int
    registered_count: int
    already_registered: bool = False
