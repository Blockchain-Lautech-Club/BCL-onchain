from __future__ import annotations

import re

from app.chain.client import registry_contract
from app.core.config import settings
from app.core.errors import AppError

LABEL_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,61})[a-z0-9]$")  # 3..63, no leading/trailing hyphen
RESERVED_PREFIXES = ("xn--",)  # block punycode/homograph tricks; on-chain reserved list handles brand names


def normalize_label(raw: str) -> str:
    """'  Philip.BCL ' -> 'philip'. Must match BCLRegistry.isValidLabel exactly (ASCII only, no NFKC magic)."""
    name = (raw or "").strip().lower()
    if name.endswith(".bcl"):
        name = name[: -len(".bcl")]
    if not LABEL_RE.match(name) or name.startswith(RESERVED_PREFIXES):
        raise AppError(422, "invalid_name", "Names use a-z, 0-9 and hyphens, 3-63 chars, no leading/trailing hyphen")
    return name


async def check_availability(label: str) -> dict:
    reg = registry_contract()
    available = await reg.functions.available(label).call()
    price = await reg.functions.pricePerYear().call()
    return {"name": f"{label}.bcl", "available": bool(available), "price_per_year_wei": str(price)}


async def build_register_quote(label: str, years: int) -> dict:
    """What the frontend needs to ask the user's wallet to send. The backend never registers on a user's behalf."""
    if not 1 <= years <= 10:
        raise AppError(422, "invalid_duration", "years must be between 1 and 10")
    reg = registry_contract()
    if not await reg.functions.available(label).call():
        raise AppError(409, "not_available", "Name is not available")
    value = await reg.functions.quote(years).call()
    return {
        "chain_id": settings.chain_id,
        "contract_address": settings.registry_contract_address,
        "function": "register",
        "args": [label, years],
        "value_wei": str(value),
    }
