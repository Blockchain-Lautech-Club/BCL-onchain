from __future__ import annotations

import re

from web3.exceptions import TransactionNotFound

from app.chain.client import get_w3
from app.core.config import settings
from app.models import Task, User
from app.services.verification.base import VerificationResult

TX_RE = re.compile(r"^0x[0-9a-fA-F]{64}$")

# Minimal ERC-721 ABI — only the balanceOf function is needed here.
_ERC721_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    }
]


def _bad_config(reason: str) -> VerificationResult:
    return VerificationResult("rejected", f"Task is misconfigured: {reason}")


def _chain_ok(req: dict) -> bool:
    return int(req.get("chain_id", settings.chain_id)) == settings.chain_id


class OnchainTxVerifier:
    """Evidence: {"tx_hash": "0x.."}. Requirements: contract_address, optional
    function_selector, event_topic, min_confirmations, chain_id."""

    async def verify(self, task: Task, user: User, evidence: dict) -> VerificationResult:
        req = task.requirements or {}
        if not _chain_ok(req):
            return _bad_config("chain_id does not match the configured chain")
        contract = str(req.get("contract_address", "")).lower()
        if not contract:
            return _bad_config("contract_address missing")

        tx_hash = str(evidence.get("tx_hash", ""))
        if not TX_RE.match(tx_hash):
            return VerificationResult("rejected", "A valid transaction hash is required")

        w3 = get_w3()
        try:
            tx = await w3.eth.get_transaction(tx_hash)
            receipt = await w3.eth.get_transaction_receipt(tx_hash)
        except TransactionNotFound:
            return VerificationResult("rejected", "Transaction not found on the configured chain")

        if receipt["status"] != 1:
            return VerificationResult("rejected", "Transaction reverted")
        if str(tx["from"]).lower() != user.wallet_address:
            return VerificationResult("rejected", "Transaction was not sent from your wallet")
        if str(tx["to"] or "").lower() != contract:
            return VerificationResult("rejected", "Transaction was not sent to the required contract")

        selector = str(req.get("function_selector", "")).lower()
        if selector and ("0x" + bytes(tx["input"])[:4].hex()) != selector:
            return VerificationResult("rejected", "Transaction did not call the required function")

        topic = str(req.get("event_topic", "")).lower()
        if topic:
            topics0 = {("0x" + bytes(lg["topics"][0]).hex()) for lg in receipt["logs"] if lg["topics"]}
            if topic not in topics0:
                return VerificationResult("rejected", "Required event was not emitted")

        required = int(req.get("min_confirmations", settings.required_confirmations))
        latest = await w3.eth.block_number
        confirmations = latest - receipt["blockNumber"] + 1
        if confirmations < required:
            return VerificationResult(
                "rejected",
                f"Needs {required} confirmations (has {confirmations}); retry shortly",
            )

        return VerificationResult("verified", data={"tx_hash": tx_hash, "block": receipt["blockNumber"]})


class NFTOwnershipVerifier:
    """Requirements: contract_address, optional min_balance (default 1), chain_id."""

    async def verify(self, task: Task, user: User, evidence: dict) -> VerificationResult:
        req = task.requirements or {}
        if not _chain_ok(req):
            return _bad_config("chain_id does not match the configured chain")
        contract_address = req.get("contract_address")
        if not contract_address:
            return _bad_config("contract_address missing")

        w3 = get_w3()
        checksum_addr = w3.to_checksum_address(contract_address)
        contract = w3.eth.contract(address=checksum_addr, abi=_ERC721_ABI)

        balance = await contract.functions.balanceOf(
            w3.to_checksum_address(user.wallet_address)
        ).call()

        need = int(req.get("min_balance", 1))
        if balance >= need:
            return VerificationResult("verified", data={"balance": balance})
        return VerificationResult("rejected", f"Wallet holds {balance}, needs at least {need}")