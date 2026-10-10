"""Pydantic schemas for the /names API."""
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# ── request bodies ─────────────────────────────────────────────────────────────

LabelStr = Annotated[str, StringConstraints(min_length=3, max_length=63, pattern=r"^[a-z0-9][a-z0-9-]*[a-z0-9]$")]


class RegisterNameRequest(BaseModel):
    """User calls this to ask the backend to relay their name registration."""
    label: str = Field(..., description="Normalized label without .bcl suffix, e.g. 'jeremiah'")
    num_years: int = Field(1, ge=1, le=10)


class RenewNameRequest(BaseModel):
    label: str
    num_years: int = Field(1, ge=1, le=10)


class SetResolverRequest(BaseModel):
    label: str
    data: str = Field(..., max_length=1024)


class TransferNameRequest(BaseModel):
    label: str
    new_owner: str = Field(..., description="Wallet address of the new owner")


# ── response bodies ────────────────────────────────────────────────────────────

class NameAvailabilityOut(BaseModel):
    name: str
    available: bool
    price_per_year_bcl_wei: str
    """Price in BCL token smallest unit (18 decimals) per year."""


class NameQuoteOut(BaseModel):
    name: str
    num_years: int
    total_cost_bcl_wei: str
    """Total BCL tokens required (approve this amount before calling register)."""
    # Convenience fields for the frontend:
    contract_address: str
    function: str           # "register" or "registerWithPermit"
    args: list              # [label, num_years]
    chain_id: int


class NameRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    label: str
    normalized_name: str
    token_id: str
    owner_wallet: str
    expires_at: datetime
    resolver_data: str
    status: str
    registration_tx: str | None
    cost_bcl_wei: str


class NameRegistrationJobOut(BaseModel):
    """Returned when the relayer accepts a sponsored registration request."""
    job_id: int
    label: str
    status: str   # queued | pending | confirmed | failed
    transaction_hash: str | None
    explorer_url: str | None = None


class BCLBalanceOut(BaseModel):
    wallet: str
    balance_wei: str          # raw uint256 as string
    allowance_wei: str        # approved to NameNFT contract
    name_nft_address: str


class NameTransferJobOut(BaseModel):
    label: str
    from_wallet: str
    to_wallet: str
    status: str
    transaction_hash: str | None
    explorer_url: str | None = None
