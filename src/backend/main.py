from advanced_alchemy.exceptions import RepositoryError
from litestar import Litestar
from litestar.exceptions import ClientException, NotAuthorizedException, NotFoundException
from litestar.logging import LoggingConfig
from litestar.openapi import OpenAPIConfig
from litestar.openapi.plugins import ScalarRenderPlugin

from src.backend.config import alchemy_plugin, settings, vite_plugin
from src.backend.controllers import CrawlController, WebController
from src.backend.lib.utils import exception_handler

app = Litestar(
    debug=settings.debug,
    route_handlers=[
        CrawlController,
        WebController,
    ],
    plugins=[
        alchemy_plugin,
        vite_plugin,
    ],
    openapi_config=OpenAPIConfig(
        title="Litegen",
        version="dev",
        path="/api/schema",
        render_plugins=[ScalarRenderPlugin()],
    ),
    logging_config=LoggingConfig(
        disable_stack_trace={
            400,
            401,
            403,
            404,
            405,
            429,
            ClientException,
            NotAuthorizedException,
            NotFoundException,
        },
        log_exceptions="always",
    ),
    exception_handlers={
        Exception: exception_handler,
        RepositoryError: exception_handler,
    },
)
