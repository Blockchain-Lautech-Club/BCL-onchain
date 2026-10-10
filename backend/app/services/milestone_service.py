"""Milestone service — create, look up, and queue mints for each milestone type.

This is the single place that translates a "something happened to this user"
event into a mint job.  All milestone logic goes through here.
"""
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.enums import MilestoneType, MintStatus
from app.models.milestone import Milestone, token_id_for
from app.models.nft import NFTMint
from app.models.user import User
from app.services.notifications import notify


# ─────────────────────────── milestone CRUD ──────────────────────────────────

async def create_milestone(
    session: AsyncSession,
    milestone_type: MilestoneType,
    type_ref_id: int,
    name: str,
    description: str = "",
    metadata_uri: str = "",
    points_threshold: int | None = None,
) -> Milestone:
    """Create a new milestone definition.  Raises IntegrityError on duplicate token_id."""
    token_id = token_id_for(milestone_type, type_ref_id)
    m = Milestone(
        milestone_type=milestone_type.value,
        type_ref_id=type_ref_id,
        token_id=token_id,
        name=name,
        description=description,
        metadata_uri=metadata_uri,
        points_threshold=points_threshold,
    )
    session.add(m)
    await session.flush()
    return m


async def get_milestone_by_token_id(session: AsyncSession, token_id: int) -> Milestone | None:
    return await session.scalar(select(Milestone).where(Milestone.token_id == token_id))


async def get_milestone_for(
    session: AsyncSession, milestone_type: MilestoneType, type_ref_id: int
) -> Milestone | None:
    token_id = token_id_for(milestone_type, type_ref_id)
    return await get_milestone_by_token_id(session, token_id)


async def list_milestones(
    session: AsyncSession, milestone_type: MilestoneType | None = None
) -> list[Milestone]:
    q = select(Milestone).order_by(Milestone.token_id)
    if milestone_type:
        q = q.where(Milestone.milestone_type == milestone_type.value)
    return list((await session.execute(q)).scalars().all())


# ─────────────────────────── mint queuing ────────────────────────────────────

async def queue_milestone_mint(
    session: AsyncSession, user: User, milestone: Milestone
) -> NFTMint | None:
    """Create a mint job for (wallet, token_id) at most once.

    Returns the new NFTMint or None if a job already exists.
    """
    existing = await session.scalar(
        select(NFTMint.id).where(
            NFTMint.wallet   == user.wallet_address,
            NFTMint.token_id == milestone.token_id,
        )
    )
    if existing:
        return None
    try:
        async with session.begin_nested():
            mint = NFTMint(
                user_id=user.id,
                wallet=user.wallet_address,
                token_id=milestone.token_id,
                milestone_type=milestone.milestone_type,
                strategy=settings.mint_strategy,
                status=MintStatus.QUEUED,
            )
            session.add(mint)
            await session.flush()
        return mint
    except IntegrityError:
        return None


# ───────────────── type-specific award helpers ────────────────────────────────

async def award_level_milestone(
    session: AsyncSession, user: User, level: int
) -> NFTMint | None:
    """Award the level-N milestone NFT.  Milestone must already exist in DB."""
    m = await get_milestone_for(session, MilestoneType.LEVEL, level)
    if m is None:
        return None  # milestone not configured yet — skip silently
    mint = await queue_milestone_mint(session, user, m)
    if mint:
        await notify(
            session, user.id, "level_nft_queued",
            f"Level {level} NFT is being minted for you!",
            {"milestone": m.name, "token_id": m.token_id},
        )
    return mint


async def award_task_milestone(
    session: AsyncSession, user: User, task_id: int
) -> NFTMint | None:
    """Award the task-completion milestone NFT for a specific task."""
    m = await get_milestone_for(session, MilestoneType.TASK, task_id)
    if m is None:
        return None  # this task has no milestone NFT configured
    mint = await queue_milestone_mint(session, user, m)
    if mint:
        await notify(
            session, user.id, "task_nft_queued",
            f"You earned the '{m.name}' NFT!",
            {"milestone": m.name, "token_id": m.token_id},
        )
    return mint


async def award_streak_milestone(
    session: AsyncSession, user: User, streak_days: int
) -> NFTMint | None:
    """Award the streak-N-days milestone NFT."""
    m = await get_milestone_for(session, MilestoneType.STREAK, streak_days)
    if m is None:
        return None
    mint = await queue_milestone_mint(session, user, m)
    if mint:
        await notify(
            session, user.id, "streak_nft_queued",
            f"You earned the '{m.name}' streak NFT!",
            {"milestone": m.name, "token_id": m.token_id},
        )
    return mint


async def award_community_milestone(
    session: AsyncSession, user: User, community_milestone_id: int
) -> NFTMint | None:
    """Award a community milestone NFT by its sequential ID."""
    m = await get_milestone_for(session, MilestoneType.COMMUNITY, community_milestone_id)
    if m is None:
        return None
    mint = await queue_milestone_mint(session, user, m)
    if mint:
        await notify(
            session, user.id, "community_nft_queued",
            f"You earned the '{m.name}' community NFT!",
            {"milestone": m.name, "token_id": m.token_id},
        )
    return mint
