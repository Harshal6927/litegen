from datetime import datetime

from google import genai
from msgspec import Struct


class PostCrawl(Struct):
    website_url: str
    gemini_api_key: str
    url_filters: list[str] | None = None

    async def validate_api_key(self) -> bool:
        try:
            genai_client = genai.Client(api_key=self.gemini_api_key).aio
            _ = await genai_client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents="Test",
            )
            await genai_client.aclose()
        except Exception:
            return False
        return True


class Crawl(Struct):
    id: int
    website_url: str
    url_filters: list[str] | None
    pages: int
    status: str
    meta: dict
    created_at: datetime
    updated_at: datetime
    llms: str | None = None
    llms_full: str | None = None


class GetCrawl(Struct):
    count: int
    crawls: list[Crawl]
