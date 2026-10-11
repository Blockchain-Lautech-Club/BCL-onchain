from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import TaskStatus, VerificationType


def _check_image_url(v: str | None) -> str | None:
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not (v.startswith("https://") or (v.startswith("/") and not v.startswith("//"))):
        raise ValueError("image_url must be an https:// URL or a site-relative /path")
    return v


class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1, max_length=10_000)
    category: str = Field(default="general", max_length=48)
    image_url: str | None = Field(default=None, max_length=500)
    points: int = Field(gt=0, le=100_000)
    verification_type: VerificationType
    requirements: dict = Field(default_factory=dict)
    deadline: datetime | None = None
    repeatable: bool = False

    _v_image = field_validator("image_url")(_check_image_url)


class TaskCreate(TaskBase):
    publish: bool = False


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=10_000)
    category: str | None = Field(default=None, max_length=48)
    image_url: str | None = Field(default=None, max_length=500)
    points: int | None = Field(default=None, gt=0, le=100_000)
    verification_type: VerificationType | None = None
    requirements: dict | None = None
    deadline: datetime | None = None
    repeatable: bool | None = None

    _v_image = field_validator("image_url")(_check_image_url)


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    my_state: str | None = None  # not_started|submitted|under_review|verified|rejected|expired


class SubmitRequest(BaseModel):
    evidence: dict = Field(default_factory=dict)


class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    status: str
    reason: str | None
    evidence: dict
    created_at: datetime
    verified_at: datetime | None
    tx_hash: str | None


class ReviewRequest(BaseModel):
    approve: bool
    reason: str | None = Field(default=None, max_length=1000)
