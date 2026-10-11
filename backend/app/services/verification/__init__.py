from __future__ import annotations

from app.core.errors import AppError
from app.models.enums import VerificationType
from app.services.verification.base import VerificationResult, Verifier
from app.services.verification.manual import ManualVerifier, SocialVerifier
from app.services.verification.onchain import NFTOwnershipVerifier, OnchainTxVerifier

_REGISTRY: dict[str, Verifier] = {
    VerificationType.ONCHAIN_TX: OnchainTxVerifier(),
    VerificationType.NFT_OWNERSHIP: NFTOwnershipVerifier(),
    VerificationType.SOCIAL_API: SocialVerifier(),
    VerificationType.MANUAL: ManualVerifier(),
}


def get_verifier(verification_type: str) -> Verifier:
    try:
        return _REGISTRY[verification_type]
    except KeyError:
        raise AppError(500, "unknown_verifier", f"No verifier for {verification_type}")


__all__ = ["get_verifier", "VerificationResult", "Verifier"]
