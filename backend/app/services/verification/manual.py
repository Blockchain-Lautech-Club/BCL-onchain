from __future__ import annotations

from app.models import Task, User
from app.services.verification.base import VerificationResult


class ManualVerifier:
    """Queues the submission for admin review. Also the fallback for social tasks."""

    async def verify(self, task: Task, user: User, evidence: dict) -> VerificationResult:
        return VerificationResult("under_review", "Waiting for admin review")


class SocialVerifier(ManualVerifier):
    """Extension point: add provider adapters (X, Discord, Telegram...) here once official API access is
    confirmed. Until then social tasks are reviewed manually. Provider adapters must verify against
    `LinkedSocialAccount` (OAuth-linked identity), never a handle the user merely typed."""
