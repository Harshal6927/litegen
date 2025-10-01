from enum import StrEnum

from advanced_alchemy.base import BigIntAuditBase
from advanced_alchemy.types import FileObject, JsonB
from advanced_alchemy.types.file_object.data_type import StoredObject
from sqlalchemy.orm import Mapped, mapped_column


class CrawlStatus(StrEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Crawl(BigIntAuditBase):
    __tablename__ = "crawls"

    website_url: Mapped[str]
    url_filters: Mapped[list[str] | None] = mapped_column(JsonB, default=None)
    pages: Mapped[int] = mapped_column(default=0)
    status: Mapped[CrawlStatus] = mapped_column(default=CrawlStatus.PENDING)
    meta: Mapped[dict] = mapped_column(JsonB, default={})
    llms: Mapped[FileObject | None] = mapped_column(StoredObject(backend="crawls"), default=None)
    llms_full: Mapped[FileObject | None] = mapped_column(StoredObject(backend="crawls"), default=None)
