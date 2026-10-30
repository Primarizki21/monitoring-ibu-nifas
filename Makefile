.PHONY: help setup dev dev-backend dev-frontend seed test test-all build-frontend

help:
	@echo "Perintah SIM-NIFAS Surabaya:"
	@echo "  make setup          - Siapkan environment (.env), uv sync, seed DB, & install frontend"
	@echo "  make dev            - Jalankan backend & frontend bersamaan dalam 1 terminal"
	@echo "  make dev-backend    - Jalankan backend FastAPI (port 8000)"
	@echo "  make dev-frontend   - Jalankan frontend Next.js (port 3000)"
	@echo "  make seed           - Isi data master PRD Surabaya"
	@echo "  make test           - Jalankan 10 skenario smoke test PRD"
	@echo "  make test-all       - Jalankan seluruh rangkaian uji smoke test"
	@echo "  make build-frontend - Kompilasi build production Next.js"

setup:
	@if [ ! -f .env ]; then cp .env.example .env && echo "[OK] Dibuat berkas .env dari .env.example"; fi
	uv sync
	uv run python -m app.db.prd_seed
	pnpm --prefix frontend install

dev:
	pnpm dev

dev-backend:
	uv run uvicorn app.main:app --reload --port 8000

dev-frontend:
	pnpm --prefix frontend dev

seed:
	uv run python -m app.db.prd_seed

test:
	uv run python -m tests.prd_smoke_test

test-all:
	uv run python -m tests.prd_smoke_test
	uv run python -m tests.smoke_test

build-frontend:
	pnpm --prefix frontend build
