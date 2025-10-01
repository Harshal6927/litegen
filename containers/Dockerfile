ARG BUILDER_IMAGE=python:3.12-slim-bookworm

## ---------------------------------------------------------------------------------- ##
## ----------------------------- Python base ---------------------------------------- ##
## ---------------------------------------------------------------------------------- ##

FROM ${BUILDER_IMAGE} AS python-base
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        tini git build-essential gcc g++ make \
        libglib2.0-0 libnspr4 libnss3 libdbus-1-3 libatk1.0-0 \
        libatk-bridge2.0-0 libcups2 libxcb1 libxkbcommon0 libatspi2.0-0 \
        libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
        libgbm1 libcairo2 libpango-1.0-0 libasound2 \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /root/.cache \
    && rm -rf /var/apt/lists/* \
    && rm -rf /var/cache/apt/* \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && mkdir -p /workspace/app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.8.12 /uv /uvx /bin/

## ---------------------------------------------------------------------------------- ##
## ----------------------------- Builder -------------------------------------------- ##
## ---------------------------------------------------------------------------------- ##
FROM python-base as builder

# Install python dependencies
WORKDIR /workspace/app
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --no-dev --frozen --no-install-project --no-editable

# Build frontend
COPY src ./src
RUN uvx nodeenv --quiet /opt/nodeenv/
ENV PATH="/opt/nodeenv/bin:$PATH"
RUN cd src/frontend && npm ci --ignore-scripts --no-fund
RUN cd src/frontend && npm run build

# # Build python package
# RUN uv build

## ---------------------------------------------------------------------------------- ##
## -------------------------------- Run Image --------------------------------------- ##
## ---------------------------------------------------------------------------------- ##

FROM python-base AS runner
ENV PATH="/workspace/app/.venv/bin:/usr/local/bin:$PATH" \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_SYSTEM_PYTHON=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PYTHONHASHSEED=random \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    CRAWL4AI_CONFIG_DIR=/home/nonroot/.crawl4ai \
    HOME=/home/nonroot

WORKDIR /workspace/app
COPY --from=builder /workspace/app/.venv ./.venv
COPY --from=builder /workspace/app/src/backend ./src/backend
COPY migrations ./migrations
COPY containers/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN addgroup --system --gid 65532 nonroot \
    && adduser --system --uid 65532 --ingroup nonroot --home /home/nonroot nonroot \
    && mkdir -p /home/nonroot/.crawl4ai \
    && chown -R nonroot:nonroot /workspace \
    && chown -R nonroot:nonroot /home/nonroot \
    && chown nonroot:nonroot ./entrypoint.sh
USER nonroot
STOPSIGNAL SIGINT
EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["tini", "--", "litestar", "run", "--host", "0.0.0.0", "--port", "8000"]
