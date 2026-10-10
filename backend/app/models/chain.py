from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, JSONType, utcnow


class ChainEvent(Base):
    __tablename__ = "chain_events"
    __table_args__ = (
        UniqueConstraint("chain_id", "tx_hash", "log_index", name="uq_chain_event"),
        Index("ix_chain_event_block", "block_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    chain_id: Mapped[int]
    contract_address: Mapped[str] = mapped_column(String(42))
    event_type: Mapped[str] = mapped_column(String(48))
    tx_hash: Mapped[str] = mapped_column(String(66))
    log_index: Mapped[int]
    block_number: Mapped[int] = mapped_column(BigInteger)
    args: Mapped[dict] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class IndexerState(Base):
    __tablename__ = "indexer_state"

    key: Mapped[str] = mapped_column(String(32), primary_key=True)  # "nft" | "registry"
    last_block: Mapped[int] = mapped_column(BigInteger)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_created", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    actor_wallet: Mapped[str | None] = mapped_column(String(42), nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    target_type: Mapped[str] = mapped_column(String(32))
    target_id: Mapped[str] = mapped_column(String(64))
    meta: Mapped[dict] = mapped_column(JSONType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
