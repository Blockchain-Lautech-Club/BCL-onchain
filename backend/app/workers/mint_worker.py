from __future__ import annotations

"""NFT mint worker — processes queued mint jobs for the ERC-1155 BCLRewards contract.

Job lifecycle
─────────────
  queued → pending (tx broadcast) → confirmed
                                  ↘ queued    (retry after backoff)
                                  ↘ failed    (max retries exceeded)

Mint strategies
───────────────
  whitelist  : relayer calls addToWhitelist on-chain → user's wallet calls claim().
               The job moves to "whitelisted" once the whitelist tx confirms, then
               to "confirmed" once the user's Claimed event is indexed.
               Falls back to admin_mint if the whitelist tx fails.

  admin_mint : relayer calls adminMint directly → token delivered immediately.
               Job confirmed once AdminMinted event is indexed.

Safety
──────
  • Before sending we ask the chain whether the token is already claimed.
  • The contract reverts on duplicate, giving a second safety net.
  • DB unique constraint (wallet, token_id) prevents duplicate job creation.
"""
import asyncio
import logging
from datetime import timedelta

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chain.client import get_w3
from app.chain.relayer import Relayer
from app.core.config import MINT_STRATEGY_ADMIN_MINT, MINT_STRATEGY_WHITELIST, settings
from app.core.db import SessionLocal
from app.models.nft import NFTMint
from app.models.base import utcnow
from app.models.enums import MintStatus
from app.services.notifications import notify

log = logging.getLogger("mint_worker")

STRATEGY_WHITELIST  = MINT_STRATEGY_WHITELIST
STRATEGY_ADMIN_MINT = MINT_STRATEGY_ADMIN_MINT

# Extra status used only inside this module (stored in NFTMint.status)
STATUS_WHITELISTED = "whitelisted"


def _backoff(retry_count: int) -> timedelta:
    return timedelta(seconds=min(30 * 2 ** retry_count, 3600))


async def _record_failure(session: AsyncSession, job: NFTMint, reason: str) -> None:
    job.retry_count += 1
    job.failure_reason = reason[:1000]
    if job.retry_count >= settings.mint_max_retries:
        job.status = MintStatus.FAILED
        await notify(
            session, job.user_id, "nft_failed",
            f"Token {job.token_id} mint failed; support has been alerted.",
            {"token_id": job.token_id, "milestone_type": job.milestone_type},
        )
        log.error("mint job %s failed permanently: %s", job.id, reason)
    else:
        job.status = MintStatus.QUEUED
        job.next_attempt_at = utcnow() + _backoff(job.retry_count)


async def process_next(session: AsyncSession, relayer: Relayer) -> bool:
    """Pick the oldest queued job, process one step, return True if a job was found."""
    now = utcnow()
    job: NFTMint | None = (
        await session.execute(
            select(NFTMint)
            .where(
                NFTMint.status == MintStatus.QUEUED,
                or_(NFTMint.next_attempt_at.is_(None), NFTMint.next_attempt_at <= now),
            )
            .order_by(NFTMint.id)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
    ).scalar_one_or_none()

    if job is None:
        return False

    try:
        # ── Guard: already claimed on-chain? ──────────────────────────────────
        if await relayer.has_claimed(job.wallet, job.token_id):
            log.info("token %s already claimed for %s — marking confirmed", job.token_id, job.wallet)
            job.status = MintStatus.CONFIRMED
            job.on_chain_confirmed = True
            await session.commit()
            return True

        # ── Execute strategy ──────────────────────────────────────────────────
        strategy = job.strategy or settings.mint_strategy

        if strategy == STRATEGY_WHITELIST:
            # Check if already whitelisted (idempotent)
            already = await relayer.is_whitelisted(job.wallet, job.token_id)
            if not already:
                tx_hash = await relayer.send_whitelist(job.wallet, job.token_id)
                job.transaction_hash = tx_hash
                log.info("whitelist tx %s sent for job %s (token %s → %s)",
                         tx_hash, job.id, job.token_id, job.wallet)
            else:
                log.info("wallet %s already whitelisted for token %s", job.wallet, job.token_id)
            # Mark as whitelisted — indexer will set CONFIRMED when Claimed event arrives
            job.status = STATUS_WHITELISTED

        elif strategy == STRATEGY_ADMIN_MINT:
            tx_hash = await relayer.send_admin_mint(job.wallet, job.token_id)
            job.transaction_hash = tx_hash
            job.status = MintStatus.PENDING
            log.info("adminMint tx %s sent for job %s (token %s → %s)",
                     tx_hash, job.id, job.token_id, job.wallet)

        else:
            await _record_failure(session, job, f"Unknown strategy: {strategy}")

    except Exception as exc:  # noqa: BLE001
        log.warning("mint job %s error: %s", job.id, exc)
        await _record_failure(session, job, str(exc))

    await session.commit()
    return True


async def check_pending(session: AsyncSession, relayer: Relayer) -> None:
    """Confirm pending admin_mint transactions; time out stale ones."""
    w3 = get_w3()
    now = utcnow()
    timeout_cutoff = now - timedelta(seconds=settings.mint_pending_timeout_seconds)

    pending = (
        await session.execute(
            select(NFTMint).where(NFTMint.status == MintStatus.PENDING)
        )
    ).scalars().all()

    for job in pending:
        if not job.transaction_hash:
            await _record_failure(session, job, "pending job has no tx_hash")
            continue

        try:
            receipt = await w3.eth.get_transaction_receipt(job.transaction_hash)
            if receipt is None:
                if job.updated_at < timeout_cutoff:
                    await _record_failure(session, job, "tx timed out — not mined")
                continue
            if receipt["status"] == 1:
                confirmed = receipt["blockNumber"]
                chain_block = await w3.eth.block_number
                if chain_block - confirmed >= settings.required_confirmations:
                    job.status = MintStatus.CONFIRMED
                    job.on_chain_confirmed = True
                    log.info("job %s confirmed (token %s → %s)", job.id, job.token_id, job.wallet)
                    await notify(session, job.user_id, "nft_confirmed",
                                 f"Your {job.milestone_type} NFT (token {job.token_id}) has been minted!",
                                 {"token_id": job.token_id, "milestone_type": job.milestone_type,
                                  "tx_hash": job.transaction_hash})
            else:
                await _record_failure(session, job, "tx reverted on-chain")
        except Exception as exc:  # noqa: BLE001
            log.warning("receipt check failed for job %s: %s", job.id, exc)

    await session.commit()


async def run_forever() -> None:
    relayer = Relayer()
    log.info("mint worker started (strategy=%s)", settings.mint_strategy)
    while True:
        try:
            async with SessionLocal() as session:
                found = await process_next(session, relayer)
            async with SessionLocal() as session:
                await check_pending(session, relayer)
            if not found:
                await asyncio.sleep(settings.mint_poll_seconds)
        except Exception as exc:  # noqa: BLE001
            log.error("mint worker loop error: %s", exc)
            await asyncio.sleep(settings.mint_poll_seconds)


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_forever())
