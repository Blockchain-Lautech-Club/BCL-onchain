"""Create tables + seed placeholder level thresholds.   python -m scripts.init_db

Dev convenience only. For production use Alembic migrations (`alembic init`, autogenerate from app.models.Base).
Thresholds below are PLACEHOLDERS: the real values are an open product decision.
"""
import asyncio

from sqlalchemy import select

from app.core.db import SessionLocal, engine
from app.models import Base, LevelConfig

DEFAULT_THRESHOLDS = [100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as s:
        if not (await s.execute(select(LevelConfig).limit(1))).first():
            s.add_all(LevelConfig(level=i + 1, threshold=t) for i, t in enumerate(DEFAULT_THRESHOLDS))
            await s.commit()
            print(f"Seeded {len(DEFAULT_THRESHOLDS)} levels")
    print("Database ready")


if __name__ == "__main__":
    asyncio.run(main())
