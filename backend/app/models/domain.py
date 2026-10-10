from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow
from app.models.enums import DomainStatus


class DomainRecord(Base):
    """Projection of BCLRegistry state, written only by the indexer/reconciler."""

    __tablename__ = "domain_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    normalized_name: Mapped[str] = mapped_column(String(70), unique=True, index=True)  # "philip.bcl"
    label: Mapped[str] = mapped_column(String(63))
    owner_wallet: Mapped[str] = mapped_column(String(42), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolver_data: Mapped[str] = mapped_column(Text, default="")
    registration_tx: Mapped[str | None] = mapped_column(String(66), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default=DomainStatus.ACTIVE)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
