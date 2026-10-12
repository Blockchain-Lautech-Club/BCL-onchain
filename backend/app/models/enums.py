from __future__ import annotations

try:
    from enum import StrEnum
except ImportError:
    from enum import Enum
    class StrEnum(str, Enum):
        pass


class UserStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class RoleName(StrEnum):
    USER = "user"
    ADMIN = "admin"


class TaskStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class VerificationType(StrEnum):
    ONCHAIN_TX = "onchain_tx"          # user proves they sent a tx to a contract/function
    NFT_OWNERSHIP = "nft_ownership"    # user holds an ERC-721 from a contract
    SOCIAL_API = "social_api"          # social / x / twitter / spaces / follow / like
    INSTANT = "instant"                # instant claim bonus / welcome reward
    MANUAL = "manual"                  # admin reviews evidence


class SubmissionStatus(StrEnum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"


class UserTaskState(StrEnum):
    """What the frontend shows per task."""
    NOT_STARTED = "not_started"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class MintStatus(StrEnum):
    QUEUED = "queued"
    PENDING = "pending"        # tx broadcast, waiting for confirmation
    CONFIRMED = "confirmed"
    FAILED = "failed"          # retries exhausted; admin can retry


class DomainStatus(StrEnum):
    ACTIVE = "active"
    RELEASED = "released"


class MilestoneType(StrEnum):
    """Must match MT_* constants in BCLRewards.sol."""
    LEVEL     = "level"      # on-chain type 1 — awarded at each level threshold
    TASK      = "task"       # on-chain type 2 — awarded for completing a specific task
    STREAK    = "streak"     # on-chain type 3 — awarded for N consecutive active days
    COMMUNITY = "community"  # on-chain type 4 — awarded for community actions

    def to_contract_type(self) -> int:
        return {"level": 1, "task": 2, "streak": 3, "community": 4}[self.value]
