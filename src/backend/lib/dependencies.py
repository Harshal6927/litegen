from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.lib.services import CrawlService


async def provide_crawl_service(
    db_session: AsyncSession | None = None,
) -> AsyncGenerator[CrawlService, None]:
    async with CrawlService.new(
        session=db_session,
        error_messages={
            "not_found": "No crawl found with the given ID.",
        },
    ) as service:
        yield service
