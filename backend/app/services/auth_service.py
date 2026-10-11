from __future__ import annotations

import secrets
from datetime import timedelta

from eth_account import Account
from eth_account.messages import encode_defunct
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3

from app.core.config import settings
from app.core.errors import AppError
from app.models import AuthNonce, Role, User
from app.models.base import as_utc, utcnow
from app.models.enums import RoleName


def normalize_address(address: str) -> str:
    if not isinstance(address, str) or not Web3.is_address(address):
        raise AppError(400, "invalid_address", "Invalid wallet address")
    return address.lower()


def build_message(address: str, nonce: str, issued_at) -> str:
    """EIP-4361-style text. Rebuilt server-side at verify time, so the client cannot alter what was signed."""
    return (
        f"{settings.auth_domain} wants you to sign in with your Ethereum account:\n"
        f"{Web3.to_checksum_address(address)}\n\n"
        "Sign in to BCL Onchain. This request will not trigger a blockchain transaction or cost any gas.\n\n"
        f"URI: {settings.auth_uri}\n"
        f"Chain ID: {settings.chain_id}\n"
        f"Nonce: {nonce}\n"
        f"Issued At: {as_utc(issued_at).isoformat()}"
    )


async def issue_nonce(session: AsyncSession, address: str) -> tuple[str, str]:
    address = normalize_address(address)
    await session.execute(delete(AuthNonce).where(AuthNonce.address == address))
    issued_at = utcnow().replace(microsecond=0)
    row = AuthNonce(
        address=address,
        nonce=secrets.token_hex(16),
        issued_at=issued_at,
        expires_at=issued_at + timedelta(seconds=settings.nonce_ttl_seconds),
    )
    session.add(row)
    await session.commit()
    return row.nonce, build_message(address, row.nonce, issued_at)


async def verify_login(session: AsyncSession, address: str, signature: str) -> User:
    address = normalize_address(address)
    row = await session.scalar(select(AuthNonce).where(AuthNonce.address == address).with_for_update())
    if row is None or as_utc(row.expires_at) < utcnow():
        raise AppError(401, "nonce_expired", "Request a new nonce and sign again")

    message = build_message(address, row.nonce, row.issued_at)
    try:
        recovered = Account.recover_message(encode_defunct(text=message), signature=signature)
    except Exception:
        raise AppError(401, "invalid_signature", "Signature could not be verified")
    if recovered.lower() != address:
        raise AppError(401, "invalid_signature", "Signature does not match wallet address")

    await session.delete(row)  # single use

    user = await session.scalar(select(User).where(User.wallet_address == address))
    if user is None:
        try:
            async with session.begin_nested():
                user = User(wallet_address=address)
                session.add(user)
                await session.flush()
        except IntegrityError:
            user = await session.scalar(select(User).where(User.wallet_address == address))
    if user.status != "active":
        raise AppError(403, "account_suspended", "This account is suspended")

    if address in settings.bootstrap_admins:
        has_admin = await session.scalar(
            select(Role.id).where(Role.user_id == user.id, Role.role == RoleName.ADMIN)
        )
        if not has_admin:
            session.add(Role(user_id=user.id, role=RoleName.ADMIN))
    await session.commit()
    return user
