-- PRD 10: enkripsi AES-256 pada kolom sensitif (NIK, telepon, riwayat diagnosis).
-- Kunci dibuat secara acak di Vault oleh migrasi data berikutnya; tidak pernah
-- disimpan di kode, environment aplikasi, atau file migrasi ini.
create or replace function kunci_enkripsi_nifas() returns text
language sql stable security definer set search_path = public, extensions, vault as $$
    select decrypted_secret from vault.decrypted_secrets where name = 'nifas_encryption_key'
$$;

create or replace function kunci_enkripsi_nifas() returns text
language sql stable security definer set search_path = public, extensions, vault as $$
    select decrypted_secret from vault.decrypted_secrets where name = 'nifas_encryption_key'
$$;

create or replace function enkripsi_nifas(p_teks text) returns text
language sql stable security definer set search_path = public, extensions, vault as $$
    select case
        when p_teks is null then null
        else encode(
            extensions.pgp_sym_encrypt(p_teks, kunci_enkripsi_nifas(), 'cipher-algo=aes256, compress-algo=0'),
            'base64'
        )
    end
$$;

create or replace function dekripsi_nifas_satu(p_teks text) returns text
language sql stable security definer set search_path = public, extensions, vault as $$
    select case
        when p_teks is null then null
        else extensions.pgp_sym_decrypt(decode(p_teks, 'base64'), kunci_enkripsi_nifas())
    end
$$;

-- Satu round-trip untuk seluruh baris dashboard/ekspor, bukan satu RPC per kolom.
create or replace function dekripsi_nifas_banyak(p_teks text[]) returns text[]
language sql stable security definer set search_path = public, extensions, vault as $$
    select coalesce(array_agg(dekripsi_nifas_satu(t) order by urut), '{}')::text[]
      from unnest(p_teks) with ordinality as x(t, urut)
$$;

-- Blind index untuk pencarian NIK: format aslinya sudah dienkripsi sehingga
-- tidak bisa dipakai lagi oleh cek duplikasi 40 hari (PRD 7.3).
create or replace function hash_nik(p_nik text) returns text
language sql stable security definer set search_path = public, extensions, vault as $$
    select encode(
        extensions.hmac(p_nik::bytea, (kunci_enkripsi_nifas() || ':nik')::bytea, 'sha256'),
        'hex'
    )
$$;

alter table tr_discharge drop constraint if exists tr_discharge_nik_check;
alter table tr_discharge drop constraint if exists tr_discharge_no_whatsapp_ibu_check;
alter table tr_discharge alter column nik type text;
alter table tr_discharge alter column no_whatsapp_ibu type text;
alter table tr_discharge add column if not exists nik_hash text;
create index if not exists idx_discharge_nik_hash on tr_discharge(nik_hash);

-- Enkripsi saat KRS disimpan. Trigger tidak menerima parameter aplikasi,
-- oleh karena itu kunci harus bisa dibaca dari dalam database.
create or replace function discharge_sebelum_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    nik_asli text := new.nik;
begin
    new.deadline_sla := new.waktu_krs + interval '48 hours';
    new.token_expires_at := new.waktu_krs + interval '7 days';
    select puskesmas_id into new.puskesmas_id from m_kelurahan where id = new.kelurahan_id;
    select id into new.bidan_kelurahan_id
      from users
     where role = 'BIDAN_KELURAHAN' and kelurahan_id = new.kelurahan_id and is_active
     order by created_at
     limit 1;

    new.nik_hash := hash_nik(nik_asli);
    new.nik := enkripsi_nifas(new.nik);
    new.no_whatsapp_ibu := enkripsi_nifas(new.no_whatsapp_ibu);
    new.diagnosis_sebelum_pulang := enkripsi_nifas(new.diagnosis_sebelum_pulang);
    new.diagnosis_perawatan := enkripsi_nifas(new.diagnosis_perawatan);
    new.rekomendasi_perawatan_rumah := enkripsi_nifas(new.rekomendasi_perawatan_rumah);
    return new;
end $$;

-- Catatan asuhan bidan juga berisi riwayat klinis (PRD 10).
create or replace function home_visit_sebelum_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    d tr_discharge%rowtype;
    masalah text[] := '{}';
    status_baru status_kesehatan_ibu := 'SEHAT';
begin
    select * into d from tr_discharge where id = new.discharge_id for update;

    new.bidan_pelaksana_id := coalesce(new.bidan_pelaksana_id, d.bidan_kelurahan_id);
    new.durasi_jam_sejak_krs := round(extract(epoch from new.waktu_kunjungan - d.waktu_krs) / 3600.0, 2);

    if new.suhu_tubuh > 38.0 then masalah := array_append(masalah, format('Demam %s°C', new.suhu_tubuh)); end if;
    if new.perdarahan_abnormal then masalah := array_append(masalah, 'Perdarahan banyak'); end if;
    if new.nyeri_perut_hebat then masalah := array_append(masalah, 'Nyeri perut hebat'); end if;
    if new.luka_berbau_infeksi then masalah := array_append(masalah, 'Luka berbau/infeksi'); end if;
    if new.pusing_muntah_lemas then masalah := array_append(masalah, 'Pusing/muntah/lemas'); end if;

    if cardinality(masalah) > 0 then
        status_baru := 'TANDA_BAHAYA';
    elsif new.status_hasil = 'ADA_MASALAH' then
        status_baru := 'KOMPLIKASI';
        masalah := array_append(masalah, 'Bidan melaporkan ada masalah');
    end if;

    update tr_discharge
       set status_kunjungan = case when new.waktu_kunjungan <= d.deadline_sla
                                   then 'VISITED_ON_TIME' else 'VISITED_LATE' end::status_sla_kunjungan,
           status_kesehatan = status_baru,
           is_emergency = status_baru <> 'SEHAT',
           jadwal_kunjungan_ulang = new.konfirmasi_jadwal_kontrol
     where id = d.id;

    if status_baru <> 'SEHAT' then
        insert into tr_emergency_alert (discharge_id, jenis_masalah, waktu_laporan)
        values (d.id, array_to_string(masalah, ', '), new.waktu_kunjungan);
    end if;

    new.catatan_kebidanan := enkripsi_nifas(new.catatan_kebidanan);
    return new;
end $$;

create or replace function cek_krs_terakhir(p_nik text)
returns table (discharge_id uuid, nama_ibu varchar, waktu_krs timestamptz)
language sql stable security definer set search_path = public as $$
    select id, nama_ibu, waktu_krs
      from tr_discharge
     where nik_hash = hash_nik(p_nik) and waktu_krs > now() - interval '40 days'
     order by waktu_krs desc
     limit 1;
$$;

-- Kunci mentah tidak boleh sampai ke peran aplikasi. Fungsinya tetap bisa
-- dipanggil oleh fungsi SECURITY DEFINER lain yang dijalankan sebagai pemilik.
revoke all on function kunci_enkripsi_nifas() from public, anon, authenticated;
revoke all on function enkripsi_nifas(text) from public, anon, authenticated;
revoke all on function dekripsi_nifas_satu(text) from public, anon, authenticated;
revoke all on function hash_nik(text) from public, anon, authenticated;
grant execute on function enkripsi_nifas(text) to service_role;
grant execute on function hash_nik(text) to service_role;
grant execute on function dekripsi_nifas_satu(text) to service_role;
revoke all on function dekripsi_nifas_banyak(text[]) from public, anon;
grant execute on function dekripsi_nifas_banyak(text[]) to authenticated, service_role;

-- Isi pesan antrean WA memuat NIK dan diagnosis yang sama, jadi ikut dienkripsi.
create or replace function enkripsi_pesan_wa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    new.pesan_terkirim := enkripsi_nifas(new.pesan_terkirim);
    return new;
end $$;

drop trigger if exists trg_log_wa_enkripsi on log_notifikasi_wa;
create trigger trg_log_wa_enkripsi before insert on log_notifikasi_wa
for each row execute function enkripsi_pesan_wa();
