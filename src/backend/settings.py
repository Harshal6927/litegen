import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from advanced_alchemy.types import storages
from advanced_alchemy.types.file_object.backends.obstore import ObstoreBackend
from rich import get_console

console = get_console()


@dataclass
class ViteSettings:
    use_server_lifespan: bool = field(
        default_factory=lambda: os.getenv("VITE_USE_SERVER_LIFESPAN", "false").lower() in {"true", "1", "yes"},
    )
    host: str = field(
        default_factory=lambda: os.getenv("VITE_HOST", "0.0.0.0"),  # noqa: S104
    )
    port: int = field(
        default_factory=lambda: int(os.getenv("VITE_PORT", "8080")),
    )
    hot_reload: bool = field(
        default_factory=lambda: os.getenv("VITE_HOT_RELOAD", "false").lower() in {"true", "1", "yes"},
    )
    asset_url: str = field(
        default_factory=lambda: os.getenv("ASSET_URL", "/static/"),
    )
    is_react: bool = True
    root_dir: Path = Path(__file__).parent.parent / "frontend"
    resource_dir: Path = Path(__file__).parent.parent / "frontend" / "src"
    bundle_dir: Path = Path(__file__).parent / "web" / "static"


@dataclass
class BlobSettings:
    bucket_name: str = field(
        default_factory=lambda: os.getenv("BUCKET_NAME", "mybucket"),
    )
    endpoint: str = field(
        default_factory=lambda: os.getenv("ENDPOINT", "http://localhost:9000"),
    )
    access_key_id: str = field(
        default_factory=lambda: os.getenv("ACCESS_KEY_ID", "minioadmin"),
    )
    secret_access_key: str = field(
        default_factory=lambda: os.getenv("SECRET_ACCESS_KEY", "minioadmin"),
    )


@dataclass
class Settings:
    debug: bool = field(
        default_factory=lambda: os.getenv("DEBUG", "false").lower() in {"true", "1", "yes"},
    )
    db_connection_string: str | None = field(
        default_factory=lambda: os.getenv("DB_CONNECTION_STRING"),
    )
    vite: ViteSettings = field(default_factory=ViteSettings)
    blob: BlobSettings = field(default_factory=BlobSettings)

    def __post_init__(self):
        if not self.db_connection_string:
            raise ValueError("DB_CONNECTION_STRING environment variable is required")

        storages.register_backend(
            ObstoreBackend(
                key="crawls",
                fs=f"s3://{self.blob.bucket_name}/",
                aws_endpoint=self.blob.endpoint,
                aws_access_key_id=self.blob.access_key_id,
                aws_secret_access_key=self.blob.secret_access_key,
                # aws_virtual_hosted_style_request=False,
                # client_options={"allow_http": True},
            ),
        )

    @classmethod
    def from_env(cls, dotenv_filename: str) -> "Settings":
        env_file = (
            Path(dotenv_filename) if Path(dotenv_filename).is_absolute() else Path(f"{os.curdir}/{dotenv_filename}")
        )

        if env_file.is_file():
            from dotenv import load_dotenv

            console.print(
                f"[yellow]Loading environment configuration from {dotenv_filename}[/]",
                markup=True,
            )

            load_dotenv(env_file, override=True)
        return Settings()


@lru_cache(maxsize=1, typed=True)
def get_settings() -> Settings:
    return Settings.from_env(dotenv_filename=".env")
