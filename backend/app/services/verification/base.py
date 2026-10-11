from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from app.models import Task, User


@dataclass
class VerificationResult:
    status: str  # "verified" | "rejected" | "under_review"
    reason: str | None = None
    data: dict = field(default_factory=dict)


class Verifier(Protocol):
    async def verify(self, task: Task, user: User, evidence: dict) -> VerificationResult: ...
