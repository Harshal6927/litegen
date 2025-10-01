#!/bin/bash
set -e

# Run database migrations
litestar database upgrade --no-prompt

playwright install chromium

# Execute the main command
exec "$@"
