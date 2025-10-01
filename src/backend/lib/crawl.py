import asyncio
import json
import logging
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse

import anyio
import httpx
from advanced_alchemy.types import FileObject
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, CacheMode, CrawlerRunConfig, CrawlResult
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from google import genai
from google.genai.client import AsyncClient

from src.backend.config import sqlalchemy_config
from src.backend.lib.dependencies import provide_crawl_service
from src.backend.models import CrawlStatus
from src.backend.schema.crawl import PostCrawl

# Configuration constants
MAX_CONCURRENT_CRAWL = 10
BATCH_SIZE = 10
CONTENT_PREVIEW_LENGTH = 10000
LLM_TIMEOUT_SECONDS = 80

# Set up logger
logger = logging.getLogger(__name__)

# File extensions to exclude from crawling
EXCLUDED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
    ".ico",
    ".css",
    ".js",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".tar",
    ".gz",
    ".7z",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".xml",
    ".json",
    ".txt",
    ".csv",
}
CSS_SELECTOR = "main, sy-main, bd-main, .sy-main, .bd-main, article, .main, .content, .main-content, .article-content, .post-content, #main, #content, #main-content, .container .content, .page-content, .entry-content, [role='main']"  # noqa: E501
EXCLUDED_TAGS = ["nav", "header", "footer", "aside", "sidebar"]


@dataclass
class RateLimitTracker:
    """Tracks API rate limiting for LLM calls."""

    api_calls_made: int = 0
    last_reset_time: float = 0.0

    def should_wait_for_rate_limit(self) -> tuple[bool, float]:
        """Check if we should wait for rate limit reset.

        Returns:
            Tuple of (should_wait, wait_time_seconds)

        """
        # Check if we've made 10 API calls and need to wait
        if self.api_calls_made >= BATCH_SIZE:
            return True, LLM_TIMEOUT_SECONDS

        return False, 0.0

    def reset(self) -> None:
        """Reset rate limiting counters."""
        self.api_calls_made = 0
        self.last_reset_time = time.time()

    def record_api_call(self) -> None:
        """Record an API call."""
        self.api_calls_made += 1


@dataclass
class PageContent:
    """Represents processed page content."""

    url: str
    title: str
    description: str
    content: str


class WebsiteCrawler:
    """Asynchronous website crawler for discovering URLs within a domain."""

    def __init__(
        self,
        base_url: str,
        max_concurrent: int = MAX_CONCURRENT_CRAWL,
        url_filters: list[str] | None = None,
    ) -> None:
        """Initialize the website crawler."""
        self.base_url = base_url.rstrip("/")
        self.max_concurrent = max_concurrent
        self.url_filters = url_filters or []

        # Parse base URL components
        parsed_base = urlparse(base_url)
        self.base_scheme = parsed_base.scheme
        self.base_netloc = parsed_base.netloc
        self.base_path = parsed_base.path.rstrip("/")

        # Storage for URLs
        self.found_urls = set()
        self.visited_urls = set()
        self.to_visit = deque([base_url])

        # Semaphore for controlling concurrent requests
        self.semaphore = asyncio.Semaphore(max_concurrent)

    def is_valid_url(self, url: str) -> bool:
        """Check if URL is valid for crawling.

        Returns:
            True if the URL is valid for crawling, False otherwise.

        """
        try:
            parsed = urlparse(url)

            # Check all validity conditions at once
            return (
                not parsed.fragment  # Skip URLs with fragments (hash/anchor)
                and parsed.scheme == self.base_scheme  # Must be same scheme
                and parsed.netloc == self.base_netloc  # Must be exact same netloc
                and not any(
                    parsed.path.lower().endswith(ext) for ext in EXCLUDED_EXTENSIONS
                )  # Check excluded extensions
                and parsed.path.startswith(self.base_path)  # Must start with base path
                and not any(filter_pattern in parsed.path for filter_pattern in self.url_filters)  # Check filters
            )

        except Exception:
            return False

    def normalize_url(self, url: str) -> str:
        """Normalize URL by removing fragments and ensuring consistent format.

        Returns:
            Normalized URL string

        """
        parsed = urlparse(url)
        # Remove fragment and reconstruct URL
        normalized = urlunparse(
            (
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                parsed.query,
                "",  # Remove fragment
            ),
        )
        return normalized.rstrip("/")

    def extract_links(self, html_content: str, current_url: str) -> list[str]:
        """Extract all links from HTML content.

        Returns:
            List of valid URLs found in the HTML

        """
        soup = BeautifulSoup(html_content, "html.parser")
        links = []

        # Find all anchor tags with href attribute
        for link in soup.find_all("a", href=True):
            href = str(link["href"]).strip()
            if not href:
                continue

            # Convert relative URLs to absolute
            absolute_url = urljoin(current_url, href)
            normalized_url = self.normalize_url(absolute_url)

            if self.is_valid_url(normalized_url):
                links.append(normalized_url)

        return links

    async def fetch_page(self, client: httpx.AsyncClient, url: str) -> tuple[str, str | None]:
        """Fetch a web page asynchronously and return its content.

        Returns:
            Tuple of (url, html_content) where html_content is None if fetch failed.

        """
        async with self.semaphore:
            try:
                response = await client.get(url, timeout=10.0)
                response.raise_for_status()

                # Only process HTML content
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" in content_type:
                    return url, response.text

            except Exception as e:
                logger.warning("Error fetching %s: %s", url, e)

        return url, None

    async def crawl_batch(self, client: httpx.AsyncClient, urls: list[str]) -> dict[str, str | None]:
        """Crawl a batch of URLs concurrently.

        Returns:
            Dictionary mapping URLs to their HTML content (or None if failed).

        """
        tasks = [self.fetch_page(client, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        batch_results = {}
        for result in results:
            if isinstance(result, tuple):
                url, content = result
                batch_results[url] = content
            else:
                logger.error("Error in batch: %s", result)

        return batch_results

    async def crawl(self, max_pages: int | None = None) -> list[str]:
        """Crawl the website and collect all valid URLs asynchronously.

        Returns:
            List of discovered URLs sorted alphabetically.

        """
        pages_crawled = 0

        async with httpx.AsyncClient(
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            follow_redirects=True,
        ) as client:
            while self.to_visit and (max_pages is None or pages_crawled < max_pages):
                # Prepare batch of URLs to process
                batch_urls = []
                batch_size = min(self.max_concurrent, len(self.to_visit))

                for _ in range(batch_size):
                    if not self.to_visit:
                        break
                    url = self.to_visit.popleft()
                    if url not in self.visited_urls:
                        batch_urls.append(url)
                        self.visited_urls.add(url)
                        self.found_urls.add(url)

                if not batch_urls:
                    break

                # Crawl batch concurrently
                batch_results = await self.crawl_batch(client, batch_urls)

                # Process results and extract new links
                for url, html_content in batch_results.items():
                    if html_content:
                        links = self.extract_links(html_content, url)

                        # Add new links to crawling queue
                        for link in links:
                            if link not in self.visited_urls and link not in list(self.to_visit):
                                self.to_visit.append(link)
                                self.found_urls.add(link)
                    else:
                        logger.warning("No HTML content for %s", url)

                pages_crawled += len(batch_urls)

        # Return sorted list of unique URLs
        return sorted(self.found_urls)


async def _setup_output_files(domain: str, output_dir: Path) -> tuple[Path, Path]:
    """Set up output files for llms.txt and llms-full.txt.

    Returns:
        Tuple of (llms_path, llms_full_path)

    """
    # Create output directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)

    # Generate filenames based on domain
    base_filename = domain.replace(".", "_")
    llms_filename = f"llms_{base_filename}.txt"
    llms_full_filename = f"llms-full_{base_filename}.txt"

    llms_path = output_dir / llms_filename
    llms_full_path = output_dir / llms_full_filename

    # Initialize files with headers
    title_parts = domain.replace("www.", "").split(".")
    title = " ".join(part.capitalize() for part in title_parts[:-1])  # Exclude TLD

    # Write initial content to llms.txt
    with llms_path.open("w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(f"> Documentation and content from {domain}\n\n")
        f.write("## Documentation\n\n")

    # Write initial content to llms-full.txt
    with llms_full_path.open("w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(f"> Complete documentation and content from {domain}\n\n")
        f.write("## Documentation\n\n")

    return llms_path, llms_full_path


async def _process_content_with_ai(
    result: CrawlResult,
    genai_client: AsyncClient,
    rate_limiter: RateLimitTracker,
) -> PageContent | None:
    """Process a single crawl result with AI to generate title and description.

    Returns:
        PageContent object if successful, None if failed

    Raises:
        ValueError: If the AI response is empty or invalid.

    """
    if not (result.success and result.markdown):
        logger.warning("Failed to crawl: %s", result.url)
        return None

    # Check rate limits before making API call
    should_wait, wait_time = rate_limiter.should_wait_for_rate_limit()
    if should_wait:
        logger.info("Rate limit reached (10 calls), waiting %d seconds...", int(wait_time))
        await asyncio.sleep(wait_time)
        rate_limiter.reset()

    prompt = f"""Generate a concise title and description for this web page that would help users find relevant information.

Return ONLY a JSON response with this exact format:
{{
    "title": "Clear, specific 3-5 word title",
    "description": "Helpful 8-12 word description of what users will find"
}}

Page URL: {result.url}
Page content:
{result.markdown[:CONTENT_PREVIEW_LENGTH]}
"""  # noqa: E501

    try:
        response = await genai_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction="You are a helpful assistant that generates concise, accurate titles and descriptions for web pages. Always respond with valid JSON.",  # noqa: E501
            ),
        )

        # Record the API call
        rate_limiter.record_api_call()

        # Parse AI response
        if not response.text:
            raise ValueError("Empty response from AI")  # noqa: TRY301

        ai_text = response.text.strip()
        ai_text = ai_text.removeprefix("```json").removesuffix("```")
        ai_data = json.loads(ai_text.strip())

        return PageContent(
            url=result.url,
            title=ai_data.get("title", "Untitled"),
            description=ai_data.get("description", "No description available"),
            content=result.markdown,
        )

    except Exception as e:
        logger.warning("Failed to process AI response for %s: %s", result.url, e)
        # Fallback without AI enhancement
        return PageContent(
            url=result.url,
            title=f"Page from {urlparse(result.url).path}",
            description="Content from discovered page",
            content=result.markdown,
        )


async def _write_batch_to_files(
    batch_content: list[PageContent],
    llms_path: Path,
    llms_full_path: Path,
) -> int:
    """Write a batch of content to output files.

    Returns:
        Number of items written

    """
    if not batch_content:
        return 0

    # Filter out non-content paths
    filtered_content = []
    for item in batch_content:
        path = urlparse(item.url).path.strip("/")
        first_segment = path.split("/")[0] if path else ""

        # Skip common non-content paths
        if first_segment.lower() not in {"assets", "static", "images", "css", "js"}:
            filtered_content.append(item)

    # Append to llms.txt (navigation format)
    with llms_path.open("a", encoding="utf-8") as f:
        for item in filtered_content:
            f.write(f"- [{item.title}]({item.url}): {item.description}\n")

    # Append to llms-full.txt (full content format)
    with llms_full_path.open("a", encoding="utf-8") as f:
        for item in filtered_content:
            f.write(f"### {item.title}\n")
            f.write(f"Source: {item.url}\n\n")
            f.write(f"{item.content}\n\n")

    return len(filtered_content)


async def process_website_crawl(data: PostCrawl, crawl_id: int) -> None:
    """Crawl background task that combines URL discovery with content extraction and AI processing.

    This function:
    1. Discovers all URLs from the given website
    2. Extracts content from each URL using crawl4ai
    3. Generates AI-powered titles and descriptions
    4. Creates an llms.txt file with organized content
    """
    try:
        # Step 1: Discover all URLs from the website
        crawler = WebsiteCrawler(
            data.website_url,
            max_concurrent=MAX_CONCURRENT_CRAWL,
            url_filters=data.url_filters,
        )
        discovered_urls = await crawler.crawl()

        if not discovered_urls:
            logger.warning("No URLs discovered for: %s", data.website_url)
            return

        async with sqlalchemy_config.get_session() as db_session:
            crawl_service = await anext(provide_crawl_service(db_session))
            await crawl_service.update(
                item_id=crawl_id,
                data={"pages": len(discovered_urls), "status": CrawlStatus.IN_PROGRESS},
                auto_commit=True,
            )

        # Step 2: Setup for content extraction
        genai_client = genai.Client(api_key=data.gemini_api_key).aio
        rate_limiter = RateLimitTracker()
        rate_limiter.reset()

        # Setup output files
        domain = urlparse(data.website_url).netloc
        output_dir = Path("output")
        llms_path, llms_full_path = await _setup_output_files(domain, output_dir)

        # Step 3: Process URLs in batches
        await _process_urls_in_batches(
            discovered_urls,
            genai_client,
            rate_limiter,
            llms_path,
            llms_full_path,
        )

        await genai_client.aclose()

        # Step 4: Mark crawl as completed
        updated_data: dict[str, Any] = {"status": CrawlStatus.COMPLETED}

        async with await anyio.open_file(llms_path, encoding="utf-8") as f:
            content = await f.read()

            updated_data["llms"] = FileObject(
                backend="crawls",
                filename=f"{crawl_id}_llms.txt",
                content=content.encode("utf-8"),
            )

        async with await anyio.open_file(llms_full_path, encoding="utf-8") as f:
            content = await f.read()

            updated_data["llms_full"] = FileObject(
                backend="crawls",
                filename=f"{crawl_id}_llms_full.txt",
                content=content.encode("utf-8"),
            )

        async with sqlalchemy_config.get_session() as db_session:
            crawl_service = await anext(provide_crawl_service(db_session))
            await crawl_service.update(item_id=crawl_id, data=updated_data, auto_commit=True)

        # Clean up output files
        try:
            llms_path.unlink(missing_ok=True)
            llms_full_path.unlink(missing_ok=True)
        except Exception as e:
            logger.warning("Failed to delete output files: %s", e)

    except Exception:
        logger.exception("Error in process_website_crawl")
        async with sqlalchemy_config.get_session() as db_session:
            crawl_service = await anext(provide_crawl_service(db_session))
            await crawl_service.update(item_id=crawl_id, data={"status": CrawlStatus.FAILED}, auto_commit=True)


async def _process_urls_in_batches(
    discovered_urls: list[str],
    genai_client: AsyncClient,
    rate_limiter: RateLimitTracker,
    llms_path: Path,
    llms_full_path: Path,
) -> None:
    """Process discovered URLs in batches with rate limiting."""
    run_config = CrawlerRunConfig(
        markdown_generator=DefaultMarkdownGenerator(),
        cache_mode=CacheMode.DISABLED,
        css_selector=CSS_SELECTOR,
        excluded_tags=EXCLUDED_TAGS,
    )

    total_processed = 0

    async with AsyncWebCrawler() as web_crawler:
        for i in range(0, len(discovered_urls), BATCH_SIZE):
            batch_urls = discovered_urls[i : i + BATCH_SIZE]

            try:
                results: list[CrawlResult] = await web_crawler.arun_many(
                    urls=batch_urls,
                    config=run_config,
                )  # pyright: ignore[reportAssignmentType]

                # Process batch content with AI
                batch_content = await _process_batch_with_ai(
                    results,
                    genai_client,
                    rate_limiter,
                )

                # Write batch to files
                written_count = await _write_batch_to_files(
                    batch_content,
                    llms_path,
                    llms_full_path,
                )
                total_processed += written_count
            except Exception:
                logger.exception("Batch processing cancelled")
                continue


async def _process_batch_with_ai(
    results: list[CrawlResult],
    genai_client: AsyncClient,
    rate_limiter: RateLimitTracker,
) -> list[PageContent]:
    """Process a batch of crawl results with AI enhancement.

    Returns:
        List of processed PageContent objects

    """
    batch_content = []

    for result in results:
        page_content = await _process_content_with_ai(result, genai_client, rate_limiter)
        if page_content:
            batch_content.append(page_content)

    return batch_content
