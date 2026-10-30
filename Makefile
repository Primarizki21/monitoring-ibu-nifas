.PHONY: help setup dev build start install seed-users lint test-e2e charts docs clean

help:
	@echo "======================================================================"
	@echo "SIM-NIFAS Surabaya — Manajemen Perintah (Branch: prototype-demo)"
	@echo "======================================================================"
	@echo "Alur Setup Awal (Clone Bersih):"
	@echo "  make setup        - Siapkan web/.env.local dan install dependensi npm"
	@echo "  (Lalu isi kredensial Supabase Anda di file web/.env.local)"
	@echo "  make seed-users   - Buat 4 akun uji faskes ke database Supabase"
	@echo ""
	@echo "Alur Menjalankan Aplikasi:"
	@echo "  make dev          - Jalankan dev server Next.js (http://localhost:3000)"
	@echo "  make build        - Kompilasi build produksi Next.js"
	@echo "  make start        - Jalankan server mode produksi (setelah make build)"
	@echo ""
	@echo "Pengujian & Kualitas Kode:"
	@echo "  make lint         - Jalankan linter ESLint pada folder web/"
	@echo "  make test-e2e     - Jalankan automated E2E test Playwright"
	@echo ""
	@echo "Dokumentasi & Utilitas Lain:"
	@echo "  make charts       - Render ulang gambar diagram alir 300 DPI (Python)"
	@echo "  make docs         - Buat ulang dokumen DOCX project charter"
	@echo "  make clean        - Hapus cache build web/.next"
	@echo "======================================================================"

setup:
	@if [ ! -f web/.env.local ]; then cp web/.env.example web/.env.local && echo "[OK] Dibuat web/.env.local dari template .env.example"; else echo "[INFO] web/.env.local sudah ada."; fi
	npm --prefix web install
	@echo ""
	@echo "[SELESAI] Dependensi terpasang. Langkah berikutnya:"
	@echo "  1. Buka dan isi kredensial Supabase di web/.env.local"
	@echo "  2. Ketik 'make seed-users' untuk membuat akun nakes uji"
	@echo "  3. Ketik 'make dev' untuk menjalankan aplikasi"

dev:
	npm --prefix web run dev

build:
	npm --prefix web run build

start:
	npm --prefix web run start

install:
	npm --prefix web install

seed-users:
	@cd web && node --env-file=.env.local scripts/buat-akun-uji.mjs

lint:
	npm --prefix web run lint

test-e2e:
	npm --prefix web exec playwright test

charts:
	uv run python tools/report_docs/render_charts.py

docs:
	uv run python tools/report_docs/main.py

clean:
	rm -rf web/.next
	@echo "[OK] Cache web/.next dibersihkan."
