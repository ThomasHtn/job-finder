# Entry point for the three workspaces and the images; `make` alone lists the targets.
# Each target only wraps the documented command (CONTRIBUTING.md), so nothing here is required to work.

.DEFAULT_GOAL := help
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.PHONY: help setup db migrate contract backend frontend dev ingest password fix lint test verify e2e up down reset logs version

# npm 11, the version packageManager asks for (CI fails when a pin here or in a Dockerfile differs): npm 10.9 trips on jsdom.
NPM := npx --yes npm@11.21.1

##@ Setup

help: ## List the targets
	@awk 'BEGIN { FS = ":.*## " } /^##@/ { printf "\n%s\n", substr($$0, 5) } /^[a-z0-9-]+:.*## / { printf "  %-10s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## First run: local settings, dependencies, contract and Prisma client
	test -f backend/.env || cp backend/.env.example backend/.env
	$(NPM) install
	npm run build -w @job-finder/contract
	npm run db:generate -w backend

##@ Development

db: ## Development PostgreSQL on localhost:5434, kept between runs
	docker compose up --detach --wait postgres

migrate: ## Apply the migrations to the development database, regenerate the Prisma client
	npm run db:migrate -w backend

contract: ## Rebuild the API contract on every save
	npm run watch -w @job-finder/contract

backend: ## API on :3001
	npm run start:dev -w backend

frontend: ## App on :4201, proxying /api to :3001
	npm start -w frontend

dev: db ## Database, contract, API and app together; Ctrl+C stops them
	npm run build -w @job-finder/contract
	$(MAKE) --no-print-directory -j3 contract backend frontend

ingest: ## Run one ingestion now against the development API (the database starts out empty)
	curl --fail --silent --show-error -X POST http://localhost:3001/api/ingestion/run

password: ## Set the app password, typed without echo (empty clears it)
	@read -rsp 'Password: ' pass; echo >&2; \
	if [ -z "$$pass" ]; then npm run --silent auth:set-password -w backend -- --clear; \
	else printf '%s' "$$pass" | npm run --silent auth:set-password -w backend -- -; fi

##@ Quality

fix: ## Every auto-fix: ESLint, Stylelint, Prettier
	cd contract && npm run fix
	cd backend && npm run fix
	cd frontend && npm run fix
	npx prettier --write . --ignore-path .gitignore --ignore-path .prettierignore --ignore-path .git/info/exclude

lint: ## Linters and format checks, without the tests
	npx prettier --check . --ignore-path .gitignore --ignore-path .prettierignore --ignore-path .git/info/exclude
	cd contract && npm run format:check && npm run lint && npm run typecheck
	cd backend && npm run format:check && npm run lint && npm run typecheck
	cd frontend && npm run format:check && npm run lint && npm run typecheck

test: ## Unit tests of both halves
	cd backend && npm test
	cd frontend && npm test -- --watch=false

verify: ## CI's code gates: format, lint, types, tests with coverage floors, builds (images: make up && make e2e)
	npm run build -w @job-finder/contract
	npm run db:generate -w backend
	$(MAKE) --no-print-directory lint
	cd backend && npm run test:ci && npm run build
	cd frontend && npm run test:ci && npm run build

e2e: ## Browser tests against http://localhost:8001 (`make up` first)
	cd frontend && npm run e2e

##@ Images

up: ## Whole app from its images on http://localhost:8001, in the background
	docker compose up --build --detach --wait

down: ## Stop it, keeping the database
	docker compose down

reset: ## Stop it and drop its database, the development one included
	docker compose down --volumes

logs: ## Follow the logs of every container
	docker compose logs --follow

##@ Release

version: ## Set the version of the three workspaces before tagging: make version VERSION=1.2.0
	@if [[ ! "$(VERSION)" =~ ^[0-9]+\.[0-9]+\.[0-9]+$$ ]]; then echo 'Usage: make version VERSION=x.y.z' >&2; exit 1; fi
	$(NPM) version $(VERSION) --no-git-tag-version --workspaces --include-workspace-root
	@echo 'Commit, then tag: git tag v$(VERSION) && git push origin v$(VERSION)'
