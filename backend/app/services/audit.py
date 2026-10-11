from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog, User


async def log_action(
    session: AsyncSession,
    actor: User | None,
    action: str,
    target_type: str,
    target_id: str | int,
    meta: dict | None = None,
) -> None:
    session.add(
        AuditLog(
            actor_user_id=actor.id if actor else None,
            actor_wallet=actor.wallet_address if actor else None,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            meta=meta or {},
        )
    )
