#!/usr/bin/env bash
# Cek prasyarat development lokal SIM-NIFAS. Tidak memasang apa pun.
set -u

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
web="$root/web"
ok=0
warn=0
fail=0

lulus() { printf '[OK]   %s\n' "$1"; ok=$((ok + 1)); }
peringatan() { printf '[WARN] %s\n' "$1"; warn=$((warn + 1)); }
gagal() { printf '[FAIL] %s\n' "$1"; fail=$((fail + 1)); }

echo "Pemeriksaan prasyarat SIM-NIFAS"
echo "Repo: $root"
echo

# Node.js >= 20
if command -v node >/dev/null 2>&1; then
  versi_node=$(node -v)
  major_node=${versi_node#v}
  major_node=${major_node%%.*}
  if [ "$major_node" -ge 20 ] 2>/dev/null; then
    lulus "Node.js $versi_node"
  else
    gagal "Node.js $versi_node terlalu lama; butuh >= 20"
  fi
else
  gagal "Node.js belum terpasang; butuh >= 20"
fi

# npm
if command -v npm >/dev/null 2>&1; then
  lulus "npm $(npm -v)"
else
  gagal "npm belum terpasang"
fi

# Git
if command -v git >/dev/null 2>&1; then
  lulus "Git $(git --version | sed 's/^git version //')"
else
  peringatan "Git belum terpasang; dibutuhkan untuk clone dan commit"
fi

# Docker CLI + daemon. Supabase CLI tidak memasang Docker.
if command -v docker >/dev/null 2>&1; then
  lulus "Docker CLI $(docker --version | sed 's/^Docker version //; s/,.*//')"
  if docker info >/dev/null 2>&1; then
    lulus "Docker daemon aktif"
  else
    gagal "Docker terpasang tetapi daemon tidak bisa diakses; nyalakan Docker Desktop/service Docker atau cek izin user (grup docker)"
  fi
  if docker compose version >/dev/null 2>&1; then
    lulus "Docker Compose tersedia"
  else
    peringatan "Docker Compose tidak tersedia; dibutuhkan untuk container aplikasi web, bukan untuk Supabase lokal"
  fi
else
  gagal "Docker belum terpasang; Supabase lokal tidak bisa dijalankan"
  echo "       Install Docker Engine/Desktop lebih dulu: https://docs.docker.com/engine/install/"
fi

# Dependensi web + CLI Supabase lokal
if [ -x "$web/node_modules/.bin/supabase" ]; then
  lulus "Supabase CLI lokal $("$web/node_modules/.bin/supabase" --version 2>/dev/null | head -1)"
else
  peringatan "Supabase CLI belum terpasang di web/node_modules; jalankan: npm --prefix web install"
fi
if [ -x "$web/node_modules/.bin/playwright" ]; then
  lulus "Playwright lokal tersedia"
else
  peringatan "Playwright belum terpasang; jalankan: npm --prefix web install"
fi

# .env.local
if [ -f "$web/.env.local" ]; then
  if grep -q '^NEXT_PUBLIC_SUPABASE_URL=http://127\.0\.0\.1:54321$' "$web/.env.local"; then
    lulus "web/.env.local menunjuk Supabase lokal"
  else
    peringatan "web/.env.local ada, tetapi NEXT_PUBLIC_SUPABASE_URL bukan http://127.0.0.1:54321"
  fi
  if grep -q '^SUPABASE_SERVICE_ROLE_KEY=.' "$web/.env.local" && grep -q '^NEXT_PUBLIC_SUPABASE_ANON_KEY=.' "$web/.env.local"; then
    lulus "Kunci Supabase lokal terisi"
  else
    peringatan "Kunci Supabase di web/.env.local belum lengkap; isi dari: cd web && npx supabase status -o env"
  fi
else
  peringatan "web/.env.local belum ada; jalankan make setup lalu isi kunci dari npx supabase status -o env"
fi

# Status stack lokal. Perintah status boleh gagal saat stack belum berjalan.
if [ -x "$web/node_modules/.bin/supabase" ]; then
  if (cd "$web" && "$web/node_modules/.bin/supabase" status >/dev/null 2>&1); then
    lulus "Stack Supabase lokal sedang berjalan"
  else
    peringatan "Stack Supabase lokal belum berjalan; jalankan: make db-start"
  fi
fi

echo
echo "Ringkasan: $ok OK, $warn peringatan, $fail gagal"
if [ "$fail" -gt 0 ]; then
  echo "Perbaiki item [FAIL] sebelum menjalankan Supabase lokal."
  exit 1
fi
echo "Prasyarat wajib terpenuhi. Lanjutkan dengan: make db-start"
