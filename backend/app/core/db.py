from __future__ import annotations

from collections.abc import AsyncIterator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _clean_database_url(url: str) -> str:
    """
    Supabase's Transaction Pooler connection string includes `pgbouncer=true`
    in the query string. psycopg (v3) rejects unknown connection parameters,
    so we strip it before handing the URL to SQLAlchemy.

    Also ensures the scheme is `postgresql+psycopg` (async) rather than the
    plain `postgresql` that Supabase shows in the dashboard.
    """
    if url.startswith("sqlite"):
        return url
    parsed = urlparse(url)

    # Normalise the scheme so SQLAlchemy uses the async psycopg driver.
    scheme = parsed.scheme
    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+psycopg"
    elif scheme == "postgresql+asyncpg":
        # asyncpg is fine too; leave it as-is.
        pass

    # Strip query params that psycopg doesn't understand.
    BLOCKED_PARAMS = {"pgbouncer", "sslmode"}  # sslmode is handled via connect_args
    qs = parse_qs(parsed.query, keep_blank_values=True)
    cleaned_qs = {k: v for k, v in qs.items() if k not in BLOCKED_PARAMS}

    cleaned = parsed._replace(scheme=scheme, query=urlencode(cleaned_qs, doseq=True))
    return urlunparse(cleaned)


_db_url = _clean_database_url(settings.database_url)

engine = create_async_engine(
    _db_url,
    pool_pre_ping=True,
    # Required for Supabase Transaction Pooler (PgBouncer in transaction mode).
    # Each checkout is a fresh connection, so server-side prepared statements
    # must be disabled.
    connect_args={"prepare_threshold": None},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Request-scoped session. Routes/services commit explicitly; uncommitted work is rolled back on close."""
    async with SessionLocal() as session:
        yield session