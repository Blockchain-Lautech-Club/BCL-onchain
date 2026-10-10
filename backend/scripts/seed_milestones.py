"""Seed script — registers all DB milestones on-chain via registerMilestoneBatch().

Run after deployment once REWARDS_CONTRACT_ADDRESS is set:
  python scripts/seed_milestones.py

The script is idempotent: it only sends milestones that have
registered_on_chain == False in the DB, then marks them True on success.
"""
import asyncio
import logging
import os
import sys

# Make sure the backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from eth_account import Account
from sqlalchemy import select
from web3 import AsyncWeb3

from app.chain.abis import REWARDS_ABI
from app.chain.client import checksum, get_w3, to_hex
from app.core.config import settings
from app.core.db import SessionLocal
from app.models.milestone import Milestone

log = logging.getLogger("seed_milestones")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

BATCH_SIZE = 50   # registerMilestoneBatch gas ceiling


async def main() -> None:
    if not settings.relayer_private_key:
        log.error("RELAYER_PRIVATE_KEY not set")
        sys.exit(1)
    if settings.rewards_contract_address == "0x" + "0" * 40:
        log.error("REWARDS_CONTRACT_ADDRESS not set")
        sys.exit(1)

    w3      = get_w3()
    account = Account.from_key(settings.relayer_private_key)
    contract = w3.eth.contract(
        address=checksum(settings.rewards_contract_address),
        abi=REWARDS_ABI,
    )

    async with SessionLocal() as session:
        pending: list[Milestone] = list(
            (await session.execute(
                select(Milestone)
                .where(Milestone.registered_on_chain == False)   # noqa: E712
                .order_by(Milestone.token_id)
            )).scalars().all()
        )

    if not pending:
        log.info("All milestones already registered on-chain.")
        return

    log.info("%d milestone(s) to register", len(pending))

    # Process in batches
    for start in range(0, len(pending), BATCH_SIZE):
        batch = pending[start : start + BATCH_SIZE]
        token_ids      = [m.token_id for m in batch]
        milestone_types = [m.milestone_type_int for m in batch]
        names          = [m.name for m in batch]
        metadata_uris  = [m.metadata_uri for m in batch]

        # milestone_type_int: convert string → int
        # MilestoneType.to_contract_type() does this, but we don't want to import the enum
        _type_map = {"level": 1, "task": 2, "streak": 3, "community": 4}
        milestone_types = [_type_map[m.milestone_type] for m in batch]

        nonce = await w3.eth.get_transaction_count(account.address, "pending")
        tx    = await contract.functions.registerMilestoneBatch(
            token_ids, milestone_types, names, metadata_uris
        ).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": settings.chain_id,
        })
        signed  = account.sign_transaction(tx)
        tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
        log.info("batch tx sent: %s  (%d milestones)", to_hex(tx_hash), len(batch))

        # Wait for confirmation
        receipt = await w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        if receipt["status"] != 1:
            log.error("tx reverted: %s", to_hex(tx_hash))
            sys.exit(1)
        log.info("confirmed in block %s", receipt["blockNumber"])

        # Mark as registered in DB
        ids = [m.id for m in batch]
        async with SessionLocal() as session:
            rows = list(
                (await session.execute(
                    select(Milestone).where(Milestone.id.in_(ids))
                )).scalars().all()
            )
            for row in rows:
                row.registered_on_chain = True
            await session.commit()

    log.info("Done — all milestones registered on-chain.")


if __name__ == "__main__":
    asyncio.run(main())
