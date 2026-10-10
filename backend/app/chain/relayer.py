"""Relayer — server-side key that interacts with on-chain contracts on behalf of the platform.

Rewards strategies (per-job via MintJob.strategy):
  • "whitelist"  — relayer calls addToWhitelist; user's wallet calls claim() later.
  • "admin_mint" — relayer mints directly (platform pays gas, instant delivery).

Name registration strategy:
  • relayerRegister(label, userWallet, numYears) — pulls BCL from user's pre-approved allowance
    into the treasury; user pays BCL, relayer pays gas.
  • adminRegister(label, to, numYears) — admin path, no BCL charged.

Run exactly ONE mint worker per relayer key (nonce management is sequential/local).
"""
from eth_account import Account

from app.chain.client import checksum, get_w3, name_nft_contract, rewards_contract, to_hex
from app.core.config import settings


class Relayer:
    def __init__(self) -> None:
        if not settings.relayer_private_key:
            raise RuntimeError("RELAYER_PRIVATE_KEY is not configured")
        self.w3       = get_w3()
        self.account  = Account.from_key(settings.relayer_private_key)
        self.rewards  = rewards_contract(self.w3)
        self.name_nft = name_nft_contract(self.w3)

    # ─────────────────── read helpers ────────────────────────────────────────

    async def has_claimed(self, wallet: str, token_id: int) -> bool:
        return await self.rewards.functions.hasClaimed(checksum(wallet), token_id).call()

    async def is_whitelisted(self, wallet: str, token_id: int) -> bool:
        return await self.rewards.functions.isWhitelisted(checksum(wallet), token_id).call()

    async def balance_of(self, wallet: str, token_id: int) -> int:
        return await self.rewards.functions.balanceOf(checksum(wallet), token_id).call()

    # ─────────────────── write helpers ───────────────────────────────────────

    async def send_whitelist(self, wallet: str, token_id: int) -> str:
        """Whitelist wallet for one self-claim of token_id."""
        nonce = await self.w3.eth.get_transaction_count(self.account.address, "pending")
        tx = await self.rewards.functions.addToWhitelist(
            checksum(wallet), token_id
        ).build_transaction({"from": self.account.address, "nonce": nonce, "chainId": settings.chain_id})
        signed   = self.account.sign_transaction(tx)
        tx_hash  = await self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return to_hex(tx_hash)

    async def send_admin_mint(self, wallet: str, token_id: int) -> str:
        """Mint token_id directly to wallet (gas paid by relayer)."""
        nonce = await self.w3.eth.get_transaction_count(self.account.address, "pending")
        tx = await self.rewards.functions.adminMint(
            checksum(wallet), token_id
        ).build_transaction({"from": self.account.address, "nonce": nonce, "chainId": settings.chain_id})
        signed  = self.account.sign_transaction(tx)
        tx_hash = await self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return to_hex(tx_hash)

    async def send_revoke_whitelist(self, wallet: str, token_id: int) -> str:
        """Revoke a pending whitelist entry (e.g. task expired)."""
        nonce = await self.w3.eth.get_transaction_count(self.account.address, "pending")
        tx = await self.rewards.functions.revokeWhitelist(
            checksum(wallet), token_id
        ).build_transaction({"from": self.account.address, "nonce": nonce, "chainId": settings.chain_id})
        signed  = self.account.sign_transaction(tx)
        tx_hash = await self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return to_hex(tx_hash)

    # ─────────────────── name NFT helpers ────────────────────────────────────

    async def send_relayer_register(self, label: str, user_wallet: str, num_years: int) -> str:
        """Register a .bcl name on behalf of a user.

        Calls relayerRegister(label, userWallet, numYears) on BCLNameNFT.
        BCL tokens are pulled FROM the user's wallet (they must have pre-approved
        the NameNFT contract); the relayer only pays gas.

        Raises on-chain errors (e.g. name already taken, insufficient allowance).
        """
        nonce = await self.w3.eth.get_transaction_count(self.account.address, "pending")
        tx = await self.name_nft.functions.relayerRegister(
            label, checksum(user_wallet), num_years
        ).build_transaction({"from": self.account.address, "nonce": nonce, "chainId": settings.chain_id})
        signed  = self.account.sign_transaction(tx)
        tx_hash = await self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return to_hex(tx_hash)

    async def send_admin_register_name(self, label: str, to_wallet: str, num_years: int) -> str:
        """Admin-register a name (any label, including reserved, no BCL charged)."""
        nonce = await self.w3.eth.get_transaction_count(self.account.address, "pending")
        tx = await self.name_nft.functions.adminRegister(
            label, checksum(to_wallet), num_years
        ).build_transaction({"from": self.account.address, "nonce": nonce, "chainId": settings.chain_id})
        signed  = self.account.sign_transaction(tx)
        tx_hash = await self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return to_hex(tx_hash)

    async def send_relayer_renew(self, label: str, user_wallet: str, num_years: int) -> str:
        """Relay a renewal for an existing name.

        The renewal is called from the user's address perspective, but the relayer
        pays gas.  The user must have pre-approved BCL tokens for the cost.
        Note: the BCLNameNFT renew() function checks msg.sender == owner, so for
        relayed renewals the contract must expose a relayerRenew or the user signs
        directly.  Until that's added, we return the calldata for the user to sign.
        """
        # For now, return the calldata — the user's wallet must sign the renewal
        # (contract enforces msg.sender == owner on renew).
        # A future relayerRenew(label, owner, numYears) on the contract would allow
        # full gas sponsorship here as well.
        raise NotImplementedError(
            "Renewal requires the owner's wallet signature. "
            "Use the /names/renew endpoint to get calldata for the user's wallet."
        )
