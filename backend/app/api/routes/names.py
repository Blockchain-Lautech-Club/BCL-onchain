"""Names API — BCL ENS-style name registry backed by BCLNameNFT.

Public endpoints:
    GET  /names/availability          — is a name free?
    GET  /names/quote                 — BCL cost breakdown
    GET  /names/resolve/{name}        — resolve a .bcl name to wallet + metadata
    GET  /names/{label}               — raw record for a label

Authenticated endpoints:
    GET  /names/me                    — all names owned by the current user
    GET  /names/me/bcl-balance        — BCL token balance + allowance for NameNFT
    POST /names/register              — submit a relayer-sponsored registration
    POST /names/renew                 — submit a relayer-sponsored renewal
    POST /names/resolver              — update resolver data (user's wallet, not relayer)
    POST /names/transfer              — transfer ownership to another wallet

Admin endpoints:
    POST /names/admin/register        — register any label to any wallet, free
    POST /names/admin/reserve         — mark labels as reserved
    PUT  /names/admin/price           — update price per year

Design decisions
────────────────
• The relayer calls relayerRegister(label, userWallet, numYears) on BCLNameNFT.
  This pulls BCL tokens FROM the user (they must pre-approve), so the backend
  never needs to hold user BCL.
• No user can register a name that is already claimed:
  — on-chain: _isOpen() blocks it inside _doRegister().
  — backend: verify_registration_prereqs() does a pre-flight available() call.
• Transfers are ERC-721 native: the user calls transferFrom/safeTransferFrom
  directly from their wallet.  The backend provides a helper quote-like endpoint
  to build the calldata, but the tx is signed by the user.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_session, is_admin
from app.chain.client import checksum, get_w3, name_nft_contract
from app.core.config import settings
from app.core.errors import AppError
from app.models.name_job import NameJob
from app.models.name_nft import NameNFTRecord
from app.models.user import User
from app.schemas.names import (
    BCLBalanceOut,
    NameAvailabilityOut,
    NameQuoteOut,
    NameRecordOut,
    NameRegistrationJobOut,
    RegisterNameRequest,
    RenewNameRequest,
    SetResolverRequest,
    TransferNameRequest,
)
from app.services import name_service

router = APIRouter(prefix="/names", tags=["names"])


# ── helpers ────────────────────────────────────────────────────────────────────

def _job_out(job: NameJob) -> NameRegistrationJobOut:
    return NameRegistrationJobOut(
        job_id=job.id,
        label=job.label,
        status=job.status,
        transaction_hash=job.transaction_hash,
        explorer_url=settings.explorer_tx_url(job.transaction_hash),
    )


# ── public: availability & resolution ─────────────────────────────────────────

@router.get("/availability", response_model=NameAvailabilityOut)
async def check_availability(name: str = Query(..., description="Label or full name (e.g. 'jeremiah' or 'jeremiah.bcl')")):
    """Check whether a .bcl name is open for registration and return the yearly BCL price."""
    label = name_service.normalize_label(name)
    result = await name_service.check_availability(label)
    return NameAvailabilityOut(
        name=result["name"],
        available=result["available"],
        price_per_year_bcl_wei=result["price_per_year_bcl_wei"],
    )


@router.get("/quote", response_model=NameQuoteOut)
async def quote(
    name: str = Query(...),
    years: int = Query(1, ge=1, le=10),
):
    """Return the total BCL cost and the exact calldata needed for registration."""
    label = name_service.normalize_label(name)
    result = await name_service.build_quote(label, years)
    return NameQuoteOut(**result)


@router.get("/resolve/{name}", response_model=NameRecordOut)
async def resolve(name: str, session: AsyncSession = Depends(get_session)):
    """Resolve a .bcl name using the indexed off-chain DB.
    Returns 404 if the name is not registered or has expired.
    """
    label = name_service.normalize_label(name)
    rec = await name_service.resolve_name(label, session)
    return NameRecordOut.model_validate(rec)


@router.get("/{label}", response_model=NameRecordOut)
async def get_name(label: str, session: AsyncSession = Depends(get_session)):
    """Raw record lookup by label.  Raises 404 if not found."""
    label = name_service.normalize_label(label)
    rec = await session.scalar(select(NameNFTRecord).where(NameNFTRecord.label == label))
    if rec is None:
        raise AppError(404, "name_not_found", f"'{label}.bcl' has never been registered")
    return NameRecordOut.model_validate(rec)


# ── authenticated: user's own names ───────────────────────────────────────────

@router.get("/me", response_model=list[NameRecordOut])
async def my_names(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """All .bcl names currently owned by the authenticated user."""
    records = await name_service.get_names_for_wallet(current_user.wallet_address, session)
    return [NameRecordOut.model_validate(r) for r in records]


@router.get("/me/bcl-balance", response_model=BCLBalanceOut)
async def my_bcl_balance(current_user: User = Depends(get_current_user)):
    """Return the user's BCL token balance and their current approval for the NameNFT contract.
    The frontend uses this to show whether the user needs to 'approve' before registering.
    """
    result = await name_service.get_user_bcl_balance(current_user.wallet_address)
    return BCLBalanceOut(**result)


# ── authenticated: register ────────────────────────────────────────────────────

@router.post("/register", response_model=NameRegistrationJobOut, status_code=202)
async def register_name(
    body: RegisterNameRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Submit a name registration request.

    The backend relayer will call relayerRegister(label, userWallet, numYears) on
    BCLNameNFT, which pulls BCL tokens from the user's wallet into the treasury.
    The user must have already approved the NameNFT contract for the required amount
    (see GET /names/quote for the exact figure).

    Returns a job record; poll its status or wait for the NameRegistered event.

    Errors:
      409 — name already claimed
      402 — insufficient BCL balance or allowance
    """
    label = name_service.normalize_label(body.label)

    # Pre-flight: verify name is still free and user can pay.
    cost_wei = await name_service.verify_registration_prereqs(
        label, current_user.wallet_address, body.num_years
    )

    # Create the relayer job.
    job = NameJob(
        user_id=current_user.id,
        label=label,
        normalized_name=f"{label}.bcl",
        num_years=body.num_years,
        kind="register",
        cost_bcl_wei=str(cost_wei),
        status="queued",
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return _job_out(job)


# ── authenticated: renew ───────────────────────────────────────────────────────

@router.post("/renew", response_model=NameRegistrationJobOut, status_code=202)
async def renew_name(
    body: RenewNameRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Renew an existing name you own.

    Only the current NFT owner can renew.  The call is relayed by the backend so
    users don't need BCL for gas, but they must approve BCL tokens for the cost.

    Renewal extends from the current expiry (not from now), so act before or
    during the 30-day grace period.
    """
    label = name_service.normalize_label(body.label)

    # Verify on-chain ownership.
    w3         = get_w3()
    contract   = name_nft_contract(w3)
    on_chain_owner = await contract.functions.ownerOfLabel(label).call()
    if on_chain_owner.lower() != current_user.wallet_address.lower():
        raise AppError(403, "not_owner", "Only the current owner can renew this name")

    cost_wei = int(await contract.functions.quote(body.num_years).call())

    job = NameJob(
        user_id=current_user.id,
        label=label,
        normalized_name=f"{label}.bcl",
        num_years=body.num_years,
        kind="renew",
        cost_bcl_wei=str(cost_wei),
        status="queued",
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return _job_out(job)


# ── authenticated: resolver data ───────────────────────────────────────────────

@router.post("/resolver")
async def set_resolver(
    body: SetResolverRequest,
    current_user: User = Depends(get_current_user),
):
    """Return the calldata for the user's wallet to call setResolverData on-chain.

    The backend does NOT relay this — resolver updates are low-stakes and the
    user signs them directly (no BCL cost, only gas).
    """
    label = name_service.normalize_label(body.label)
    if len(body.data.encode()) > 1024:
        raise AppError(422, "data_too_long", "Resolver data must be ≤ 1024 bytes")

    w3         = get_w3()
    contract   = name_nft_contract(w3)
    on_chain_owner = await contract.functions.ownerOfLabel(label).call()
    if on_chain_owner.lower() != current_user.wallet_address.lower():
        raise AppError(403, "not_owner", "Only the owner can update resolver data for this name")

    # Return calldata for the frontend to sign.
    return {
        "chain_id": settings.chain_id,
        "contract_address": settings.name_nft_address,
        "function": "setResolverData",
        "args": [label, body.data],
    }


# ── authenticated: transfer ────────────────────────────────────────────────────

@router.post("/transfer")
async def transfer_name(
    body: TransferNameRequest,
    current_user: User = Depends(get_current_user),
):
    """Return the calldata for the user's wallet to transfer a name NFT.

    Transfers are standard ERC-721 — the user's wallet signs safeTransferFrom.
    The backend provides the exact call details; no relayer involved here.
    Resolver data is cleared automatically by the contract on transfer.
    """
    label = name_service.normalize_label(body.label)
    try:
        new_owner_cs = checksum(body.new_owner)
    except Exception:
        raise AppError(422, "invalid_address", "new_owner is not a valid EVM address")

    w3         = get_w3()
    contract   = name_nft_contract(w3)

    # Confirm ownership and get token ID.
    on_chain_owner = await contract.functions.ownerOfLabel(label).call()
    if on_chain_owner.lower() != current_user.wallet_address.lower():
        raise AppError(403, "not_owner", "You do not own this name")

    token_id = await contract.functions.tokenIdOf(label).call()

    return {
        "chain_id": settings.chain_id,
        "contract_address": settings.name_nft_address,
        "function": "safeTransferFrom",
        "args": [current_user.wallet_address, new_owner_cs, str(token_id)],
        "description": f"Transfer '{label}.bcl' from {current_user.wallet_address} to {new_owner_cs}. "
                       "Resolver data will be cleared.",
    }


# ── admin ──────────────────────────────────────────────────────────────────────

@router.post("/admin/register", response_model=NameRegistrationJobOut, status_code=202)
async def admin_register(
    body: RegisterNameRequest,
    to: str = Query(..., description="Wallet to register the name to"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Admin-only: register any label (including reserved) to any wallet, free of BCL charge."""
    if not await is_admin(session, current_user):
        raise AppError(403, "forbidden", "Admin only")

    label = name_service.normalize_label(body.label)
    try:
        checksum(to)
    except Exception:
        raise AppError(422, "invalid_address", "Invalid wallet address")

    job = NameJob(
        user_id=current_user.id,
        label=label,
        normalized_name=f"{label}.bcl",
        num_years=body.num_years,
        kind="admin_register",
        cost_bcl_wei="0",
        status="queued",
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return _job_out(job)


@router.post("/admin/reserve")
async def admin_reserve(
    labels: list[str],
    reserved: bool = True,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Admin-only: mark labels as reserved (only admin can register them)."""
    if not await is_admin(session, current_user):
        raise AppError(403, "forbidden", "Admin only")
    normalized = [name_service.normalize_label(l) for l in labels]
    # Return calldata for the admin's wallet (or the relayer key) to sign.
    return {
        "chain_id": settings.chain_id,
        "contract_address": settings.name_nft_address,
        "function": "setReserved",
        "args": [normalized, reserved],
    }


@router.put("/admin/price")
async def admin_set_price(
    price_bcl_wei: str = Query(..., description="New price per year in BCL wei (uint256 as string)"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Admin-only: update the per-year BCL token price for name registrations."""
    if not await is_admin(session, current_user):
        raise AppError(403, "forbidden", "Admin only")
    try:
        int(price_bcl_wei)
    except ValueError:
        raise AppError(422, "invalid_price", "price_bcl_wei must be a decimal integer string")
    return {
        "chain_id": settings.chain_id,
        "contract_address": settings.name_nft_address,
        "function": "setPricePerYear",
        "args": [price_bcl_wei],
    }


# ── job status ─────────────────────────────────────────────────────────────────

@router.get("/jobs/{job_id}", response_model=NameRegistrationJobOut)
async def job_status(
    job_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Poll registration/renewal job status."""
    job = await session.scalar(
        select(NameJob).where(NameJob.id == job_id, NameJob.user_id == current_user.id)
    )
    if job is None:
        raise AppError(404, "job_not_found", "Job not found")
    return _job_out(job)
