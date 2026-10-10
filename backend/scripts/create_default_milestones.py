"""Create default milestones in the DB (levels 1-10, core streaks, sample task/community).

Run once after init_db.py:
  python scripts/create_default_milestones.py

Add more or change names/URIs as needed — then run seed_milestones.py to
push them on-chain.
"""
import asyncio
import os
import sys
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.exc import IntegrityError

from app.core.db import SessionLocal
from app.models.enums import MilestoneType
from app.services.milestone_service import create_milestone

log = logging.getLogger("create_milestones")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

BASE_URI = "ipfs://YOUR_BASE_CID/"   # replace with your actual IPFS CID after upload

# ── Define default milestones ─────────────────────────────────────────────────

LEVEL_MILESTONES = [
    # (level, name, points_threshold)
    (1,  "Builder",       100),
    (2,  "Contributor",   250),
    (3,  "Advocate",      500),
    (4,  "Enthusiast",    1000),
    (5,  "Pioneer",       2000),
    (6,  "Champion",      3500),
    (7,  "Legend",        5000),
    (8,  "Visionary",     7500),
    (9,  "Trailblazer",  10000),
    (10, "BCL Master",   15000),
]

STREAK_MILESTONES = [
    (3,  "3-Day Streak",   "Show up 3 days in a row"),
    (7,  "7-Day Streak",   "A full week of activity"),
    (30, "30-Day Streak",  "Consistent for a month"),
    (90, "90-Day Streak",  "Three months of dedication"),
]

TASK_MILESTONES = [
    # (task_db_id, name, description)
    (1, "First Task",      "Complete your very first task"),
    (2, "Chain Explorer",  "Complete an on-chain verification task"),
    (3, "Social Star",     "Complete a social-verification task"),
]

COMMUNITY_MILESTONES = [
    # (community_id, name, description)
    (1, "Early Adopter",     "Joined during the founding cohort"),
    (2, "Event Attendee",    "Attended a BCL event"),
    (3, "Workshop Graduate", "Completed a BCL workshop"),
]


async def main() -> None:
    async with SessionLocal() as session:
        created = 0

        # Levels
        for level, name, threshold in LEVEL_MILESTONES:
            try:
                await create_milestone(
                    session,
                    milestone_type=MilestoneType.LEVEL,
                    type_ref_id=level,
                    name=name,
                    description=f"Reach level {level} on the BCL platform",
                    metadata_uri=f"{BASE_URI}level_{level}.json",
                    points_threshold=threshold,
                )
                created += 1
            except IntegrityError:
                await session.rollback()
                log.info("level %d already exists — skipped", level)

        # Streaks
        for days, name, desc in STREAK_MILESTONES:
            try:
                await create_milestone(
                    session,
                    milestone_type=MilestoneType.STREAK,
                    type_ref_id=days,
                    name=name,
                    description=desc,
                    metadata_uri=f"{BASE_URI}streak_{days}.json",
                )
                created += 1
            except IntegrityError:
                await session.rollback()
                log.info("streak %d already exists — skipped", days)

        # Tasks
        for task_id, name, desc in TASK_MILESTONES:
            try:
                await create_milestone(
                    session,
                    milestone_type=MilestoneType.TASK,
                    type_ref_id=task_id,
                    name=name,
                    description=desc,
                    metadata_uri=f"{BASE_URI}task_{task_id}.json",
                )
                created += 1
            except IntegrityError:
                await session.rollback()
                log.info("task milestone %d already exists — skipped", task_id)

        # Community
        for comm_id, name, desc in COMMUNITY_MILESTONES:
            try:
                await create_milestone(
                    session,
                    milestone_type=MilestoneType.COMMUNITY,
                    type_ref_id=comm_id,
                    name=name,
                    description=desc,
                    metadata_uri=f"{BASE_URI}community_{comm_id}.json",
                )
                created += 1
            except IntegrityError:
                await session.rollback()
                log.info("community milestone %d already exists — skipped", comm_id)

        await session.commit()
        log.info("Created %d milestone(s). Next: run seed_milestones.py to register on-chain.", created)


if __name__ == "__main__":
    asyncio.run(main())
