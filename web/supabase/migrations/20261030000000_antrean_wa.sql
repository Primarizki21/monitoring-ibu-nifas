-- Antrean pengiriman WhatsApp (PRD 10: retry maks 3x dengan exponential backoff).

-- Klaim batch pesan yang siap dikirim. Baris yang diklaim "disewa" 2 menit:
-- bila worker mati di tengah jalan, baris otomatis bisa diambil lagi.
create or replace function ambil_antrean_wa(p_batas int default 20)
returns setof log_notifikasi_wa
language sql security definer set search_path = public as $$
    update log_notifikasi_wa l
       set jumlah_percobaan = l.jumlah_percobaan + 1,
           next_retry_at = now() + interval '2 minutes'
     where l.id in (
        select id from log_notifikasi_wa
         where status_pengiriman = 'QUEUED' and next_retry_at <= now()
         order by case prioritas when 'URGENT' then 0 when 'HIGH' then 1 else 2 end, created_at
         limit p_batas
         for update skip locked)
    returning l.*;
$$;

-- Fungsi internal hanya untuk service_role (worker & cron), bukan pengguna login.
revoke execute on function ambil_antrean_wa(int) from public, anon, authenticated;
revoke execute on function tandai_tidak_dikunjungi() from public, anon, authenticated;
grant execute on function ambil_antrean_wa(int) to service_role;
grant execute on function tandai_tidak_dikunjungi() to service_role;
