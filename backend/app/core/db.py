from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

def normalize_db_url(raw_url: str) -> str:
    url = (raw_url or "").strip()
    if not url:
        return "sqlite+aiosqlite:////tmp/bcl.db"
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # asyncpg expects ssl= rather than sslmode=
    if "sslmode=require" in url:
        url = url.replace("sslmode=require", "ssl=require")
    return url

_db_url = normalize_db_url(settings.database_url)
_connect_args = (
    {"prepared_statement_cache_size": 0}
    if "postgresql" in _db_url
    else {}
)

<<<<<<< HEAD
=======
engine = create_async_engine(
    _db_url,
    pool_pre_ping=True,
    connect_args=_connect_args,
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
>>>>>>> b1298a7303a22b207e5d3ce1c318eefdaf605332

async def get_session() -> AsyncIterator[AsyncSession]:
    """Request-scoped session. Routes/services commit explicitly; uncommitted work is rolled back on close."""
    async with SessionLocal() as session:
        yield session
