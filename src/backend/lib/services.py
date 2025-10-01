from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import (
    SQLAlchemyAsyncRepositoryService,
)

from src.backend.models import Crawl


class CrawlService(SQLAlchemyAsyncRepositoryService[Crawl]):
    class CrawlRepository(SQLAlchemyAsyncRepository[Crawl]):
        model_type = Crawl

    repository_type = CrawlRepository
