from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TaskStatus, VerificationType


class TaskBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=1, max_length=10_000)
    category: str = Field(default="general", max_length=48)
    points: int = Field(gt=0, le=100_000)
    verification_type: VerificationType
    requirements: dict = Field(default_factory=dict)
    deadline: datetime | None = None
    repeatable: bool = False


class TaskCreate(TaskBase):
    publish: bool = False


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=10_000)
    category: str | None = Field(default=None, max_length=48)
    points: int | None = Field(default=None, gt=0, le=100_000)
    verification_type: VerificationType | None = None
    requirements: dict | None = None
    deadline: datetime | None = None
    repeatable: bool | None = None


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
