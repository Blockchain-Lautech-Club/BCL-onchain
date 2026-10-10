"""Name registration worker.

Picks up queued NameJob rows and submits them to the chain via the relayer.
Runs as a background task alongside the mint worker.

Job kinds handled:
  register       → relayer.send_relayer_register(label, user_wallet, num_years)
  admin_register → relayer.send_admin_register_name(label, to_wallet, num_years)
  renew          → not relayed (owner must sign); job is auto-failed with a message
"""
import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chain.relayer import Relayer
from app.core.config import settings
from app.core.db import async_session
from app.models.name_job import NameJob
from app.models.user import User

log = logging.getLogger(__name__)

_relayer: Relayer | None = None


def _get_relayer() -> Relayer:
    global _relayer
    if _relayer is None:
        _relayer = Relayer()
    return _relayer


async def _process_job(job: NameJob, session: AsyncSession) -> None:
    relayer = _get_relayer()

    # Look up the user's wallet for this job.
    user = await session.scalar(select(User).where(User.id == job.user_id))
    if user is None:
        job.status = "failed"
        job.failure_reason = "User not found"
        return

    job.status = "pending"
    await session.commit()

    try:
        if job.kind == "register":
            tx_hash = await relayer.send_relayer_register(
                job.label, user.wallet_address, job.num_years
            )
        elif job.kind == "admin_register":
            # For admin registrations, target wallet is stored in failure_reason field
            # temporarily (a bit hacky — a proper to_wallet column would be cleaner).
            to_wallet = job.failure_reason or user.wallet_address
            job.failure_reason = None
            tx_hash = await relayer.send_admin_register_name(
                job.label, to_wallet, job.num_years
            )
        elif job.kind == "renew":
            job.status = "failed"
            job.failure_reason = (
                "Renewals require the owner's wallet signature. "
                "Please call renew() directly from your wallet using the calldata "
                "returned by POST /names/renew."
            )
            await session.commit()
            return
        else:
            job.status = "failed"
            job.failure_reason = f"Unknown job kind: {job.kind}"
            await session.commit()
            return

        job.transaction_hash = tx_hash

        # Wait for confirmation.
        w3 = relayer.w3
        receipt = await w3.eth.wait_for_transaction_receipt(
            tx_hash,
            timeout=120,
            poll_latency=settings.indexer_poll_seconds,
        )
        if receipt.status == 1:
            job.status = "confirmed"
            log.info("name_job=%d label=%s tx=%s confirmed", job.id, job.label, tx_hash)
        else:
            job.status = "failed"
            job.failure_reason = f"Transaction reverted: {tx_hash}"
            log.warning("name_job=%d label=%s tx=%s REVERTED", job.id, job.label, tx_hash)

    except Exception as exc:
        job.retries += 1
        if job.retries >= settings.mint_max_retries:
            job.status = "failed"
            job.failure_reason = str(exc)
            log.error("name_job=%d FAILED after %d retries: %s", job.id, job.retries, exc)
        else:
            job.status = "queued"
            log.warning("name_job=%d retry %d/%d: %s", job.id, job.retries, settings.mint_max_retries, exc)

    await session.commit()


async def run_name_worker() -> None:
    """Poll for queued name jobs and process them sequentially."""
    log.info("Name worker started")
    while True:
        try:
            async with async_session() as session:
                jobs = (
                    await session.execute(
                        select(NameJob)
                        .where(NameJob.status == "queued")
                        .order_by(NameJob.id)
                        .limit(10)
                        .with_for_update(skip_locked=True)
                    )
                ).scalars().all()
                for job in jobs:
                    await _process_job(job, session)
        except Exception as exc:
            log.exception("Name worker loop error: %s", exc)

        await asyncio.sleep(settings.mint_poll_seconds)
