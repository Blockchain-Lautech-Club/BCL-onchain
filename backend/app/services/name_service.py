from __future__ import annotations

"""Business logic for BCL Name NFT operations.

Flow for a user-initiated registration:
  1. Frontend calls GET /names/availability?name=jeremiah  → check on-chain
  2. Frontend calls GET /names/quote?name=jeremiah&years=1  → get BCL cost
  3. User approves BCL spend in their wallet (approve(nameNftAddress, cost))
  4. Frontend calls POST /names/register  → backend relayer calls relayerRegister
     which pulls BCL from user's wallet into treasury — user never pays gas
  5. Indexer picks up the NameRegistered event and writes a NameNFTRecord row

The relayer sponsor flow means:
  • User must have BCL tokens and must have approved the NameNFT contract.
  • Backend relayer pays gas on Botchain.
  • No already-claimed name can be re-registered (on-chain _isOpen guard).
"""
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chain.client import bcl_token_contract, get_w3, name_nft_contract
from app.core.config import settings
from app.core.errors import AppError
from app.models.name_nft import NameNFTRecord
from app.models.user import User

LABEL_RE = re.compile(r"^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$")
RESERVED_PREFIXES = ("xn--",)


# ── label helpers ──────────────────────────────────────────────────────────────

def normalize_label(raw: str) -> str:
    """'  Jeremiah.BCL ' → 'jeremiah'.  Raises 422 on invalid input."""
    name = (raw or "").strip().lower()
    if name.endswith(".bcl"):
        name = name[: -len(".bcl")]
    if len(name) < 3 or len(name) > 63:
        raise AppError(422, "invalid_name", "Name must be 3–63 characters")
    if not LABEL_RE.match(name) or name.startswith(RESERVED_PREFIXES):
        raise AppError(422, "invalid_name",
                       "Names use a-z, 0-9 and hyphens (3-63 chars, no leading/trailing hyphen)")
    return name


# ── on-chain reads ─────────────────────────────────────────────────────────────

async def check_availability(label: str) -> dict:
    """Ask the NameNFT contract whether `label` is open for registration."""
    w3       = get_w3()
    contract = name_nft_contract(w3)
    available    = await contract.functions.available(label).call()
    price_per_yr = await contract.functions.pricePerYear().call()
    return {
        "name": f"{label}.bcl",
        "available": bool(available),
        "price_per_year_bcl_wei": str(price_per_yr),
    }


async def build_quote(label: str, num_years: int) -> dict:
    """Return what the user's wallet needs to approve before the backend can register."""
    if not 1 <= num_years <= 10:
        raise AppError(422, "invalid_duration", "years must be 1–10")
    w3       = get_w3()
    contract = name_nft_contract(w3)

    available = await contract.functions.available(label).call()
    if not available:
        raise AppError(409, "not_available", f"'{label}.bcl' is not available")

    total_cost = await contract.functions.quote(num_years).call()
    return {
        "name": f"{label}.bcl",
        "num_years": num_years,
        "total_cost_bcl_wei": str(total_cost),
        "contract_address": settings.name_nft_address,
        "function": "register",         # user approves; relayer calls relayerRegister
        "args": [label, num_years],
        "chain_id": settings.chain_id,
    }


async def resolve_name(label: str, session: AsyncSession) -> NameNFTRecord:
    """Return the indexed NameNFTRecord or raise 404."""
    rec = await session.scalar(
        select(NameNFTRecord).where(NameNFTRecord.label == label, NameNFTRecord.status == "active")
    )
    if rec is None:
        raise AppError(404, "name_not_found", f"'{label}.bcl' is not registered or has expired")
    return rec


async def get_user_bcl_balance(wallet: str) -> dict:
    """Return the user's BCL balance and their current allowance for the NameNFT contract."""
    w3           = get_w3()
    token        = bcl_token_contract(w3)
    from app.chain.client import checksum
    cs_wallet    = checksum(wallet)
    cs_nft       = checksum(settings.name_nft_address)

    balance   = await token.functions.balanceOf(cs_wallet).call()
    allowance = await token.functions.allowance(cs_wallet, cs_nft).call()
    return {
        "wallet": wallet,
        "balance_wei": str(balance),
        "allowance_wei": str(allowance),
        "name_nft_address": settings.name_nft_address,
    }


async def get_names_for_wallet(wallet: str, session: AsyncSession) -> list[NameNFTRecord]:
    rows = (
        await session.execute(
            select(NameNFTRecord)
            .where(NameNFTRecord.owner_wallet == wallet.lower())
            .order_by(NameNFTRecord.created_at.desc())
        )
    ).scalars().all()
    return list(rows)


# ── on-chain writes (called by the relayer worker) ─────────────────────────────

async def verify_registration_prereqs(label: str, user_wallet: str, num_years: int) -> int:
    """Check on-chain: name available, user has enough BCL and sufficient allowance.
    Returns the total cost in wei.  Raises AppError on any failure.
    """
    w3       = get_w3()
    contract = name_nft_contract(w3)
    token    = bcl_token_contract(w3)

    from app.chain.client import checksum
    cs_wallet = checksum(user_wallet)
    cs_nft    = checksum(settings.name_nft_address)

    # 1. Name must still be available (prevents duplicate registrations).
    available = await contract.functions.available(label).call()
    if not available:
        raise AppError(409, "not_available", f"'{label}.bcl' was claimed before your request could be processed")

    # 2. Quote the cost.
    cost = await contract.functions.quote(num_years).call()

    # 3. Check the user's BCL balance.
    balance = await token.functions.balanceOf(cs_wallet).call()
    if balance < cost:
        raise AppError(402, "insufficient_bcl",
                       f"You need {cost} BCL wei but only have {balance}. "
                       "Earn more BCL by completing tasks on the platform.")

    # 4. Check allowance — user must have approved NameNFT to pull the tokens.
    allowance = await token.functions.allowance(cs_wallet, cs_nft).call()
    if allowance < cost:
        raise AppError(402, "insufficient_allowance",
                       f"Please approve at least {cost} BCL wei to the NameNFT contract "
                       f"({settings.name_nft_address}) before registering.")

    return cost
