from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, pattern=r"^[a-zA-Z0-9_]{3,32}$")
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wallet_address: str
    username: str | None
    bio: str | None
    avatar_url: str | None
    total_points: int
    level: int
    is_admin: bool = False
    next_level: int | None = None
    next_level_threshold: int | None = None
    points_to_next: int | None = None


class LeaderboardEntry(BaseModel):
    rank: int
    wallet_address: str
    username: str | None
    total_points: int
    level: int


class LedgerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    points_delta: int
    reason: str
    source_task_id: int | None
    created_at: datetime


class MintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    level: int
    status: str  # queued|pending|confirmed|failed  (UI shows success only on "confirmed")
    token_id: int | None
    transaction_hash: str | None
    explorer_url: str | None = None
    failure_reason: str | None


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    message: str
    data: dict
    read: bool
    created_at: datetime


class DomainOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    normalized_name: str
    owner_wallet: str
    expires_at: datetime
    resolver_data: str
    status: str
    registration_tx: str | None
