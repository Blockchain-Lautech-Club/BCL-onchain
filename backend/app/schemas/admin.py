from __future__ import annotations

from pydantic import BaseModel, Field


class LevelItem(BaseModel):
    level: int = Field(ge=1)
    threshold: int = Field(ge=1)


class LevelConfigIn(BaseModel):
    levels: list[LevelItem]


class RoleChange(BaseModel):
    role: str = Field(pattern="^(admin)$")
    grant: bool = True


class PointsAdjustment(BaseModel):
    user_id: int
    delta: int = Field(ne=0)
    reason: str = Field(min_length=3, max_length=500)
