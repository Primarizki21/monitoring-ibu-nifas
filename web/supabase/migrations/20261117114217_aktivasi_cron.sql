-- Aktifkan ekstensi penjadwal hanya bila tersedia di server Postgres.
-- Job tidak dijadwalkan di sini: URL aplikasi dan CRON_SECRET bergantung
-- lingkungan. Pemasangan job lewat scripts/pasang-jadwal-cron.mjs.
-- Aman dijalankan ulang.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;

  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
end $$;