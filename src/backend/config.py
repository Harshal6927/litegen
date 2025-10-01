from litestar.plugins.sqlalchemy import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from litestar_vite import ViteConfig, VitePlugin

from src.backend.settings import get_settings

settings = get_settings()


# Vite
vite_plugin = VitePlugin(
    config=ViteConfig(
        bundle_dir=settings.vite.bundle_dir,
        asset_url=settings.vite.asset_url,
        root_dir=settings.vite.root_dir,
        resource_dir=settings.vite.resource_dir,
        use_server_lifespan=settings.vite.use_server_lifespan,
        dev_mode=settings.debug,
        hot_reload=settings.vite.hot_reload,
        is_react=settings.vite.is_react,
        port=settings.vite.port,
        host=settings.vite.host,
    ),
)


# SQLAlchemy
sqlalchemy_config = SQLAlchemyAsyncConfig(
    connection_string=settings.db_connection_string,
    session_config=AsyncSessionConfig(expire_on_commit=False),
    before_send_handler="autocommit",
)
alchemy_plugin = SQLAlchemyPlugin(config=sqlalchemy_config)
