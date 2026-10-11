from __future__ import annotations

"""DB projection of BCLNameNFT on-chain state.

Written by the indexer; read by the names API.
One row per unique label — re-registrations update the existing row.
"""
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow


class NameNFTRecord(Base):
    """Projection of BCLNameNFT state, kept in sync by the indexer."""

    __tablename__ = "name_nft_records"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Identifies the name uniquely across re-registrations.
    label: Mapped[str] = mapped_column(String(63), unique=True, index=True)
    normalized_name: Mapped[str] = mapped_column(String(70), unique=True, index=True)  # "philip.bcl"

    # On-chain token ID (uint256 = keccak256(label))
    token_id: Mapped[str] = mapped_column(String(78), unique=True, index=True)  # stored as decimal string

    owner_wallet: Mapped[str] = mapped_column(String(42), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolver_data: Mapped[str] = mapped_column(Text, default="")

    # BCL cost paid on most recent registration/renewal (in wei, as decimal string).
    cost_bcl_wei: Mapped[str] = mapped_column(String(78), default="0")

    registration_tx: Mapped[str | None] = mapped_column(String(66), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active")  # active | expired | released

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
