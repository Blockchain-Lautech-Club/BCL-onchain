"""DB table for name registration/transfer jobs the relayer processes."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, utcnow


class NameJob(Base):
    """A pending or completed name-related on-chain job the relayer handles.

    Job kinds:
        register  — relayerRegister(label, to, numYears)
        renew     — called by the owner directly (no relayer needed, kept for indexer records)
        transfer  — safeTransferFrom handled by user's wallet; no relayer job needed
    """

    __tablename__ = "name_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    label: Mapped[str] = mapped_column(String(63), index=True)
    normalized_name: Mapped[str] = mapped_column(String(70))
    num_years: Mapped[int] = mapped_column(default=1)
    kind: Mapped[str] = mapped_column(String(16), default="register")  # register | renew

    # BCL cost deducted from user's wallet (informational; actual deduction on-chain)
    cost_bcl_wei: Mapped[str] = mapped_column(String(78), default="0")

    status: Mapped[str] = mapped_column(String(16), default="queued")  # queued|pending|confirmed|failed
    transaction_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    retries: Mapped[int] = mapped_column(default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
