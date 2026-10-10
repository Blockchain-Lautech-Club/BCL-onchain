"""python -m app.workers.indexer_worker"""
import asyncio
import logging
import time

from app.chain.indexer import reconcile, run_indexer_once
from app.core.config import settings

log = logging.getLogger("indexer_worker")


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    last_reconcile = 0.0
    while True:
        try:
            while await run_indexer_once():  # drain backlog without sleeping
                pass
            if time.monotonic() - last_reconcile > settings.reconcile_every_seconds:
                log.info("reconcile: %s", await reconcile())
                last_reconcile = time.monotonic()
        except Exception:
            log.exception("indexer loop error")
        await asyncio.sleep(settings.indexer_poll_seconds)


if __name__ == "__main__":
    asyncio.run(main())
