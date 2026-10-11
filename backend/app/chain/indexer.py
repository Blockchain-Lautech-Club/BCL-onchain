from __future__ import annotations

"""Event indexer + reconciler for BCLRewards (ERC-1155) and BCLRegistry.

Only blocks at least REQUIRED_CONFIRMATIONS deep are indexed.
Periodic reconcile() corrects projection drift against live chain state.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from web3._utils.events import get_event_data
from eth_utils.abi import event_abi_to_log_topic

from app.chain.abis import REWARDS_ABI, REGISTRY_ABI
from app.chain.client import checksum, get_w3, rewards_contract, registry_contract, to_hex
from app.core.config import settings
from app.core.db import SessionLocal
from app.models.chain import ChainEvent, IndexerState
from app.models.domain import DomainRecord
from app.models.nft import NFTMint
from app.models.user import User
from app.models.base import utcnow
from app.models.enums import DomainStatus, MintStatus
from app.services.notifications import notify

log = logging.getLogger("indexer")

STATUS_WHITELISTED = "whitelisted"


def _jsonable(v):
    if isinstance(v, (bytes, bytearray)):
        return "0x" + bytes(v).hex()
    if isinstance(v, int):
        return str(v)
    return v


def _events(abi: list[dict]) -> dict[bytes, dict]:
    return {bytes(event_abi_to_log_topic(e)): e for e in abi if e["type"] == "event"}


def _dt(ts: int) -> datetime:
    return datetime.fromtimestamp(int(ts), tz=timezone.utc)


# ─────────────────────────── ERC-1155 handlers ───────────────────────────────

async def _on_whitelisted(s: AsyncSession, a: dict, tx_hash: str) -> None:
    """Relayer's addToWhitelist tx confirmed — mark job as 'whitelisted'."""
    wallet   = a["wallet"].lower()
    token_id = int(a["tokenId"])
    mint = await s.scalar(
        select(NFTMint).where(NFTMint.wallet == wallet, NFTMint.token_id == token_id)
    )
    if mint and mint.status == MintStatus.PENDING:
        mint.status          = STATUS_WHITELISTED
        mint.transaction_hash = tx_hash
    # If no DB job exists (e.g. manual whitelist) we skip — this is informational only


def _milestone_type_for(token_id: int) -> str:
    """Derive milestone_type string from token_id range — mirrors BCLRewards.sol offsets."""
    if 1_000_001 <= token_id <= 1_000_100:
        return "level"
    if 2_000_001 <= token_id <= 2_999_999:
        return "task"
    if 3_000_001 <= token_id <= 3_000_365:
        return "streak"
    if 4_000_001 <= token_id <= 4_999_999:
        return "community"
    return "unknown"


async def _on_milestone_registered(s: AsyncSession, a: dict, tx_hash: str) -> None:
    """Mark the corresponding DB milestone as registered_on_chain."""
    from app.models.milestone import Milestone
    token_id = int(a["tokenId"])
    m = await s.scalar(select(Milestone).where(Milestone.token_id == token_id))
    if m:
        m.registered_on_chain = True


async def _confirm_mint(
    s: AsyncSession, wallet: str, token_id: int, tx_hash: str, strategy: str
) -> None:
    """Shared confirm logic for Claimed and AdminMinted."""
    mint = await s.scalar(
        select(NFTMint).where(NFTMint.wallet == wallet, NFTMint.token_id == token_id)
    )
    if mint is None:
        user = await s.scalar(select(User).where(User.wallet_address == wallet))
        if user is None:
            return
        mint = NFTMint(
            user_id=user.id,
            wallet=wallet,
            token_id=token_id,
            milestone_type=_milestone_type_for(token_id),
            strategy=strategy,
        )
        s.add(mint)

    first = mint.status != MintStatus.CONFIRMED
    mint.status             = MintStatus.CONFIRMED
    mint.on_chain_confirmed = True
    mint.transaction_hash   = tx_hash
    mint.failure_reason     = None

    if first:
        await notify(
            s, mint.user_id, "nft_confirmed",
            f"Your '{mint.milestone_type}' milestone NFT (token {token_id}) is confirmed!",
            {"token_id": token_id, "milestone_type": mint.milestone_type, "tx_hash": tx_hash},
        )


async def _on_claimed(s: AsyncSession, a: dict, tx_hash: str) -> None:
    """User's claim() tx confirmed — mark job confirmed."""
    await _confirm_mint(s, a["wallet"].lower(), int(a["tokenId"]), tx_hash, "whitelist")


async def _on_admin_minted(s: AsyncSession, a: dict, tx_hash: str) -> None:
    """Relayer's adminMint tx confirmed."""
    await _confirm_mint(s, a["to"].lower(), int(a["tokenId"]), tx_hash, "admin_mint")


# ─────────────────────────── Registry handlers ───────────────────────────────

async def _upsert_domain(s: AsyncSession, label: str) -> DomainRecord | None:
    return await s.scalar(
        select(DomainRecord).where(DomainRecord.normalized_name == f"{label}.bcl")
    )


async def _on_registered(s: AsyncSession, a: dict, tx_hash: str) -> None:
    rec = await _upsert_domain(s, a["label"])
    if rec is None:
        rec = DomainRecord(normalized_name=f"{a['label']}.bcl", label=a["label"])
        s.add(rec)
    rec.owner_wallet = a["owner"].lower()
    rec.expires_at   = _dt(a["expiresAt"])
    rec.resolver_data    = ""
    rec.registration_tx  = tx_hash
    rec.status           = DomainStatus.ACTIVE
    user = await s.scalar(select(User).where(User.wallet_address == rec.owner_wallet))
    if user:
        await notify(s, user.id, "domain_registered",
                     f"{rec.normalized_name} registered", {"name": rec.normalized_name})


async def _on_renewed(s: AsyncSession, a: dict, tx_hash: str) -> None:
    if rec := await _upsert_domain(s, a["label"]):
        rec.expires_at = _dt(a["newExpiresAt"])


async def _on_transferred(s: AsyncSession, a: dict, tx_hash: str) -> None:
    if rec := await _upsert_domain(s, a["label"]):
        rec.owner_wallet  = a["to"].lower()
        rec.resolver_data = ""


async def _on_resolver(s: AsyncSession, a: dict, tx_hash: str) -> None:
    if rec := await _upsert_domain(s, a["label"]):
        rec.resolver_data = a["data"]


async def _on_released(s: AsyncSession, a: dict, tx_hash: str) -> None:
    if rec := await _upsert_domain(s, a["label"]):
        rec.status = DomainStatus.RELEASED


HANDLERS = {
    # BCLRewards events
    "MilestoneRegistered": _on_milestone_registered,
    "Whitelisted":         _on_whitelisted,
    "Claimed":             _on_claimed,
    "AdminMinted":         _on_admin_minted,
    # BCLRegistry events
    "NameRegistered":  _on_registered,
    "NameRenewed":     _on_renewed,
    "NameTransferred": _on_transferred,
    "ResolverUpdated": _on_resolver,
    "NameReleased":    _on_released,
}


# ─────────────────────────── indexing loop ───────────────────────────────────

async def index_contract(key: str, address: str, abi: list[dict]) -> int:
    """Index one batch of blocks. Returns number of blocks advanced (0 = caught up)."""
    w3        = get_w3()
    topics    = _events(abi)
    safe_head = await w3.eth.block_number - settings.required_confirmations

    async with SessionLocal() as s:
        state = await s.get(IndexerState, key)
        if state is None:
            state = IndexerState(key=key, last_block=settings.indexer_start_block - 1)
            s.add(state)
        from_block = state.last_block + 1
        if from_block > safe_head:
            await s.commit()
            return 0
        to_block = min(safe_head, from_block + settings.indexer_batch_size - 1)

        logs = await w3.eth.get_logs({
            "address":   checksum(address),
            "fromBlock": from_block,
            "toBlock":   to_block,
        })
        for lg in sorted(logs, key=lambda l: (l["blockNumber"], l["logIndex"])):
            abi_entry = topics.get(bytes(lg["topics"][0])) if lg["topics"] else None
            if abi_entry is None:
                continue
            decoded  = get_event_data(w3.codec, abi_entry, lg)
            tx_hash  = to_hex(lg["transactionHash"])
            seen = await s.scalar(
                select(ChainEvent.id).where(
                    ChainEvent.chain_id        == settings.chain_id,
                    ChainEvent.tx_hash         == tx_hash,
                    ChainEvent.log_index       == lg["logIndex"],
                )
            )
            if seen:
                continue
            args = {k: _jsonable(v) for k, v in dict(decoded["args"]).items()}
            s.add(ChainEvent(
                chain_id=settings.chain_id,
                contract_address=address.lower(),
                event_type=abi_entry["name"],
                tx_hash=tx_hash,
                log_index=lg["logIndex"],
                block_number=lg["blockNumber"],
                args=args,
            ))
            handler = HANDLERS.get(abi_entry["name"])
            if handler:
                await handler(s, dict(decoded["args"]), tx_hash)

        state.last_block = to_block
        await s.commit()
    return to_block - from_block + 1


async def run_indexer_once() -> int:
    total  = await index_contract("rewards",  settings.rewards_contract_address,  REWARDS_ABI)
    total += await index_contract("registry", settings.registry_contract_address, REGISTRY_ABI)
    return total


# ─────────────────────────── reconciliation ──────────────────────────────────

async def reconcile(limit: int = 200) -> dict:
    """Compare DB projections with live chain state; fix drift."""
    w3        = get_w3()
    contract  = rewards_contract(w3)
    reg       = registry_contract(w3)
    fixed     = {"mints": 0, "domains": 0}

    async with SessionLocal() as s:
        # ── Mint reconciliation ───────────────────────────────────────────────
        mints = (
            await s.execute(
                select(NFTMint)
                .where(NFTMint.status == MintStatus.CONFIRMED)
                .limit(limit)
            )
        ).scalars().all()

        for m in mints:
            on_chain = await contract.functions.hasClaimed(checksum(m.wallet), m.token_id).call()
            if not on_chain:
                log.warning("mint %s drift: DB says confirmed but chain says not claimed", m.id)
                m.status             = MintStatus.QUEUED
                m.on_chain_confirmed = False
                m.transaction_hash   = None
                fixed["mints"]      += 1

        # ── Domain reconciliation ─────────────────────────────────────────────
        domains = (
            await s.execute(
                select(DomainRecord)
                .where(DomainRecord.status == DomainStatus.ACTIVE)
                .limit(limit)
            )
        ).scalars().all()

        for d in domains:
            owner, expires, data = await reg.functions.recordOf(d.label).call()
            if owner == "0x0000000000000000000000000000000000000000":
                d.status       = DomainStatus.RELEASED
                fixed["domains"] += 1
            elif (owner.lower() != d.owner_wallet
                  or _dt(expires) != d.expires_at.replace(tzinfo=timezone.utc)
                  or data != d.resolver_data):
                d.owner_wallet  = owner.lower()
                d.expires_at    = _dt(expires)
                d.resolver_data = data
                fixed["domains"] += 1

        await s.commit()
    return fixed
