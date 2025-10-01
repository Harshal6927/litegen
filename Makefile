.PHONY: start-infra stop-infra start-prod stop-prod install upgrade api-schema build lint

INFRA_COMPOSE_FILE := containers/docker-compose.infra.yaml
APP_COMPOSE_FILE := containers/docker-compose.prod.yaml

start-infra:
	@echo "Starting infrastructure... 🔄"
	docker compose -f $(INFRA_COMPOSE_FILE) up -d
	@echo "Infrastructure started. ✅"

stop-infra:
	@echo "Stopping infrastructure... 🔄"
	docker compose -f $(INFRA_COMPOSE_FILE) down
	@echo "Infrastructure stopped. ✅"

start-prod:
	@echo "Starting application... 🔄"
	docker compose -f $(INFRA_COMPOSE_FILE) up -d
	docker compose -f $(APP_COMPOSE_FILE) up --build -d
	@echo "Application started. ✅"

stop-prod:
	@echo "Stopping application... 🔄"
	docker compose -f $(APP_COMPOSE_FILE) down
	docker compose -f $(INFRA_COMPOSE_FILE) down
	@echo "Application stopped. ✅"

install:
	@echo "Installing dependencies... 🔄"
	uv sync
	cd src/frontend && npm ci
	@echo "Dependencies installed. ✅"

upgrade:
	@echo "Upgrading backend dependencies... 🔄"
	uv lock --upgrade
	@echo "Backend dependencies upgraded. ✅"

api-schema:
	@echo "Generating API schema... 🔄"
	cd src/frontend && npm run export-schema && npm run generate-types
	@echo "API schema generated. ✅"

build:
	@echo "Building frontend... 🔄"
	cd src/frontend && npm run build
	@echo "Frontend build completed. ✅"

lint:
	@echo "Running linters... 🔄"
	cd src/frontend && npm run lint
	pre-commit install
	pre-commit run -a
	@echo "Linters completed. ✅"
