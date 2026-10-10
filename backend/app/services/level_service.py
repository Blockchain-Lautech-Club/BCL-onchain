"""Level calculation.  Actual mint queuing is delegated to milestone_service."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.points import LevelConfig, LevelHistory
from app.models.user import User
from app.services.notifications import notify


async def get_thresholds(session: AsyncSession) -> list[tuple[int, int]]:
    rows = (
        await session.execute(
            select(LevelConfig.level, LevelConfig.threshold).order_by(LevelConfig.level)
        )
    ).all()
    return [(r.level, r.threshold) for r in rows]


def compute_level(points: int, thresholds: list[tuple[int, int]]) -> int:
    level = 0
    for lvl, threshold in sorted(thresholds):
        if points >= threshold:
            level = lvl
        else:
            break
    return level


def next_level_info(points: int, thresholds: list[tuple[int, int]]) -> dict:
    current = compute_level(points, thresholds)
    nxt = next(((l, t) for l, t in sorted(thresholds) if l > current), None)
    return {
        "level": current,
        "next_level": nxt[0] if nxt else None,
        "next_level_threshold": nxt[1] if nxt else None,
        "points_to_next": (nxt[1] - points) if nxt else None,
    }


async def sync_user_level(session: AsyncSession, user: User) -> int | None:
    """Recompute level; queue one level-milestone mint per level crossed.

    Returns the new level if it changed, else None.
    """
    # Import here to avoid circular imports
    from app.services.milestone_service import award_level_milestone

    thresholds = await get_thresholds(session)
    new_level  = compute_level(user.total_points, thresholds)
    old_level  = user.level
    if new_level == old_level:
        return None

    user.level = new_level
    session.add(LevelHistory(user_id=user.id, old_level=old_level, new_level=new_level))

    if new_level > old_level:
        for lvl in range(old_level + 1, new_level + 1):
            await award_level_milestone(session, user, lvl)
        await notify(
            session, user.id, "level_up",
            f"You reached level {new_level}!",
            {"level": new_level},
        )
    return new_level
