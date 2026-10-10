from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow
from app.models.enums import MintStatus


class NFTMint(Base):
    """One row per (wallet, token_id) — one mint job per milestone per user.

    token_id is always the on-chain ERC-1155 token ID from BCLRewards.sol:
      LEVEL      1_000_001 – 1_000_100
      TASK       2_000_001 – 2_999_999
      STREAK     3_000_001 – 3_000_365
      COMMUNITY  4_000_001 – 4_999_999
    """
    __tablename__ = "nft_mints"
    __table_args__ = (
        UniqueConstraint("wallet", "token_id", name="uq_mint_wallet_token"),
    )

    id: Mapped[int]               = mapped_column(primary_key=True)
    user_id: Mapped[int]          = mapped_column(ForeignKey("users.id"), index=True)
    wallet: Mapped[str]           = mapped_column(String(42), index=True)
    token_id: Mapped[int]         = mapped_column(index=True)
    # Denormalized for easy filtering/display — mirrors Milestone.milestone_type
    milestone_type: Mapped[str]   = mapped_column(String(16), default="")

    # "whitelist" = relayer whitelists, user calls claim()
    # "admin_mint" = relayer mints directly
    strategy: Mapped[str]         = mapped_column(String(16), default="whitelist")

    status: Mapped[str]           = mapped_column(String(16), default=MintStatus.QUEUED, index=True)
    transaction_hash: Mapped[str | None]  = mapped_column(String(66), nullable=True)
    on_chain_confirmed: Mapped[bool]      = mapped_column(Boolean, default=False)
    retry_count: Mapped[int]              = mapped_column(default=0)
    failure_reason: Mapped[str | None]    = mapped_column(Text, nullable=True)
    next_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime]  = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
