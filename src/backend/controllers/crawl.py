from advanced_alchemy.filters import LimitOffset, OrderBy, SearchFilter
from litestar import Response, get, post
from litestar.background_tasks import BackgroundTask
from litestar.controller import Controller
from litestar.di import Provide
from litestar.exceptions import ValidationException

from src.backend.lib.crawl import process_website_crawl
from src.backend.lib.dependencies import provide_crawl_service
from src.backend.lib.services import CrawlService
from src.backend.schema.crawl import Crawl, GetCrawl, PostCrawl


class CrawlController(Controller):
    path = "/api/crawl"
    tags = ["Crawl"]
    dependencies = {
        "crawl_service": Provide(provide_crawl_service),
    }

    @post("/")
    async def create_crawl(self, crawl_service: CrawlService, data: PostCrawl) -> Response[Crawl]:
        if not await data.validate_api_key():
            raise ValidationException(detail="Invalid Gemini API key")

        crawl = await crawl_service.create(data)
        crawl = Crawl(
            id=crawl.id,
            website_url=crawl.website_url,
            url_filters=crawl.url_filters,
            pages=crawl.pages,
            status=crawl.status,
            meta=crawl.meta,
            created_at=crawl.created_at,
            updated_at=crawl.updated_at,
            llms=await crawl.llms.sign_async(expires_in=300) if crawl.llms else None,
            llms_full=await crawl.llms_full.sign_async(expires_in=300) if crawl.llms_full else None,
        )

        return Response(
            content=crawl,
            background=BackgroundTask(process_website_crawl, data=data, crawl_id=crawl.id),
        )

    @get("/")
    async def list_crawls(self, crawl_service: CrawlService, term: str = "") -> GetCrawl:
        if term:
            crawls = await crawl_service.list(
                SearchFilter(field_name="website_url", value=term, ignore_case=True),
                OrderBy(field_name="created_at", sort_order="desc"),
            )
            count = len(crawls)
        else:
            crawls, count = await crawl_service.list_and_count(
                LimitOffset(limit=10, offset=0),
                OrderBy(field_name="created_at", sort_order="desc"),
            )

        crawls = [
            Crawl(
                id=crawl.id,
                website_url=crawl.website_url,
                url_filters=crawl.url_filters,
                pages=crawl.pages,
                status=crawl.status,
                meta=crawl.meta,
                created_at=crawl.created_at,
                updated_at=crawl.updated_at,
                llms=await crawl.llms.sign_async(expires_in=300) if crawl.llms else None,
                llms_full=await crawl.llms_full.sign_async(expires_in=300) if crawl.llms_full else None,
            )
            for crawl in crawls
        ]

        return GetCrawl(count=count, crawls=crawls)
