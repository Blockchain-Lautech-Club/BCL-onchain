from __future__ import annotations

"""Milestone — one row per distinct achievement NFT type.

Each milestone maps to exactly one ERC-1155 token ID in BCLRewards.sol.
The admin creates milestones via the API; the deploy seed script registers
them on-chain in a batch.

Token ID ranges (must match BCLRewards.sol constants):
  LEVEL      1_000_001 – 1_000_100
  TASK       2_000_001 – 2_999_999
  STREAK     3_000_001 – 3_000_365
  COMMUNITY  4_000_001 – 4_999_999
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow
from app.models.enums import MilestoneType

# Offsets — mirror BCLRewards.sol
LEVEL_OFFSET     = 1_000_000
TASK_OFFSET      = 2_000_000
STREAK_OFFSET    = 3_000_000
COMMUNITY_OFFSET = 4_000_000

_OFFSET = {
    MilestoneType.LEVEL:     LEVEL_OFFSET,
    MilestoneType.TASK:      TASK_OFFSET,
    MilestoneType.STREAK:    STREAK_OFFSET,
    MilestoneType.COMMUNITY: COMMUNITY_OFFSET,
}


def token_id_for(milestone_type: MilestoneType, type_ref_id: int) -> int:
    """Compute the on-chain token ID from type + the type's own sequential ID.

    type_ref_id is:
      LEVEL      → the level number (1..100)
      TASK       → task.id
      STREAK     → streak_days (1..365)
      COMMUNITY  → community milestone sequential ID
    """
    return _OFFSET[milestone_type] + type_ref_id


class Milestone(Base):
    """One row per distinct NFT milestone.  Created by admins; minted by the worker."""
    __tablename__ = "milestones"
    __table_args__ = (
        UniqueConstraint("token_id", name="uq_milestone_token_id"),
    )

    id: Mapped[int]              = mapped_column(primary_key=True)
    milestone_type: Mapped[str]  = mapped_column(String(16), index=True)  # MilestoneType value
    # Sequential reference within the type (level number, task id, streak days, etc.)
    type_ref_id: Mapped[int]     = mapped_column(Integer)
    # Computed once at creation and never changed
    token_id: Mapped[int]        = mapped_column(Integer, index=True, unique=True)

    name: Mapped[str]            = mapped_column(String(120))
    description: Mapped[str]     = mapped_column(Text, default="")
    metadata_uri: Mapped[str]    = mapped_column(Text, default="")  # IPFS/arweave URI

    # Points threshold to unlock (used for LEVEL/STREAK auto-award logic)
    points_threshold: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Whether this milestone has been registered on-chain via registerMilestone()
    registered_on_chain: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
