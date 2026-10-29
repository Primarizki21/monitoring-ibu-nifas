-- =====================================================================
-- SIM-NIFAS Surabaya — skema awal (PRD bab 5)
-- Penyesuaian terhadap PRD:
--   * users.id = auth.users.id (password dikelola Supabase Auth, tanpa password_hash)
--   * users.faskes_id dipecah menjadi puskesmas_id & rumah_sakit_id (punya FK)
--   * m_kelurahan punya kolom kecamatan sendiri untuk cascading dropdown
--   * tr_discharge menyimpan puskesmas_id & bidan_kelurahan_id yang "dikunci" saat KRS
--   * status_hasil memakai enum; ditambah kolom bantu SLA, token & antrean retry WA
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- 1. ENUMS -------------------------------------------------------------
create type role_pengguna as enum ('SUPERADMIN_DINKES', 'KEPALA_PUSKESMAS', 'BIDAN_KELURAHAN', 'BIDAN_RS');
create type status_sla_kunjungan as enum ('PENDING', 'VISITED_ON_TIME', 'VISITED_LATE', 'NOT_VISITED');
create type status_kesehatan_ibu as enum ('SEHAT', 'KOMPLIKASI', 'TANDA_BAHAYA', 'DIRAWAT_KEMBALI', 'MENINGGAL');
create type tipe_faskes_rujukan as enum ('RS', 'PUSKESMAS');
create type status_hasil_kunjungan as enum ('BAIK', 'ADA_MASALAH');

-- 2. MASTER WILAYAH & FASKES -------------------------------------------
create table m_puskesmas (
    id uuid primary key default gen_random_uuid(),
    nama_puskesmas varchar(100) not null unique,
    kecamatan varchar(50) not null,
    no_telp_operasional varchar(20),
    created_at timestamptz default now()
);

create table m_kelurahan (
    id uuid primary key default gen_random_uuid(),
    puskesmas_id uuid not null references m_puskesmas(id) on delete cascade,
    nama_kelurahan varchar(100) not null,
    kecamatan varchar(50) not null,
    created_at timestamptz default now(),
    unique (kecamatan, nama_kelurahan)
);

create table m_rumah_sakit (
    id uuid primary key default gen_random_uuid(),
    nama_rs varchar(100) not null unique,
    tipe_rs varchar(10),
    kecamatan varchar(50),
    alamat_rs text,
    created_at timestamptz default now()
);

-- 3. PENGGUNA ----------------------------------------------------------
create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    nama_lengkap varchar(150) not null,
    nip varchar(30),
    email varchar(100) unique not null,
    no_whatsapp varchar(20) not null check (no_whatsapp ~ '^\+62[0-9]{8,13}$'),
    role role_pengguna not null,
    puskesmas_id uuid references m_puskesmas(id) on delete set null,
    rumah_sakit_id uuid references m_rumah_sakit(id) on delete set null,
    kelurahan_id uuid references m_kelurahan(id) on delete set null,
    is_active boolean default true,
    created_at timestamptz default now(),
    check (role <> 'BIDAN_RS' or rumah_sakit_id is not null),
    check (role <> 'KEPALA_PUSKESMAS' or puskesmas_id is not null),
    check (role <> 'BIDAN_KELURAHAN' or kelurahan_id is not null)
);

-- 4. TRANSAKSI DISCHARGE -----------------------------------------------
create table tr_discharge (
    id uuid primary key default gen_random_uuid(),
    token_kunjungan varchar(64) unique not null default encode(extensions.gen_random_bytes(32), 'hex'),
    token_expires_at timestamptz,
    nik varchar(16) not null check (nik ~ '^[0-9]{16}$'),
    nama_ibu varchar(150) not null,
    alamat_lengkap text not null,
    kelurahan_id uuid not null references m_kelurahan(id),
    puskesmas_id uuid references m_puskesmas(id),
    bidan_kelurahan_id uuid references users(id),
    no_whatsapp_ibu varchar(20) not null check (no_whatsapp_ibu ~ '^\+62[0-9]{8,13}$'),
    diagnosis_sebelum_pulang text not null,
    diagnosis_perawatan text not null,
    rekomendasi_perawatan_rumah text not null,
    jadwal_kunjungan_ulang date not null,
    faskes_kunjungan_ulang tipe_faskes_rujukan not null,
    rs_asal_id uuid not null references m_rumah_sakit(id),
    bidan_rs_id uuid not null references users(id),
    is_readmission boolean default false,
    waktu_krs timestamptz not null default now(),
    deadline_sla timestamptz,
    status_kunjungan status_sla_kunjungan default 'PENDING',
    status_kesehatan status_kesehatan_ibu default 'SEHAT',
    is_emergency boolean default false,
    reminder_24h_sent_at timestamptz,
    alert_48h_sent_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. LAPORAN KUNJUNGAN RUMAH -------------------------------------------
create table tr_home_visit (
    id uuid primary key default gen_random_uuid(),
    discharge_id uuid unique not null references tr_discharge(id) on delete cascade,
    bidan_pelaksana_id uuid references users(id),
    waktu_kunjungan timestamptz not null default now(),
    durasi_jam_sejak_krs numeric(6,2),
    suhu_tubuh numeric(4,1) not null check (suhu_tubuh between 30 and 45),
    perdarahan_abnormal boolean default false,
    nyeri_perut_hebat boolean default false,
    luka_berbau_infeksi boolean default false,
    pusing_muntah_lemas boolean default false,
    status_hasil status_hasil_kunjungan not null,
    catatan_kebidanan text,
    konfirmasi_jadwal_kontrol date not null,
    created_at timestamptz default now()
);

-- 6. RED ALERT ---------------------------------------------------------
create table tr_emergency_alert (
    id uuid primary key default gen_random_uuid(),
    discharge_id uuid not null references tr_discharge(id) on delete cascade,
    jenis_masalah text not null,
    waktu_laporan timestamptz default now(),
    is_resolved boolean default false,
    catatan_tindakan text,
    resolved_at timestamptz,
    resolved_by uuid references users(id)
);

-- 7. LOG & ANTREAN NOTIFIKASI WHATSAPP ---------------------------------
create table log_notifikasi_wa (
    id uuid primary key default gen_random_uuid(),
    discharge_id uuid references tr_discharge(id) on delete set null,
    nomor_tujuan varchar(20) not null,
    peran_penerima varchar(50) not null,
    template_id varchar(50) not null,
    prioritas varchar(10) default 'NORMAL', -- NORMAL / HIGH / URGENT
    pesan_terkirim text not null,
    status_pengiriman varchar(20) default 'QUEUED', -- QUEUED / SENT / FAILED
    jumlah_percobaan smallint default 0,
    next_retry_at timestamptz,
    response_gateway text,
    created_at timestamptz default now()
);

-- INDEX ----------------------------------------------------------------
create index idx_discharge_nik on tr_discharge(nik);
create index idx_discharge_status_kunjungan on tr_discharge(status_kunjungan);
create index idx_discharge_kelurahan on tr_discharge(kelurahan_id);
create index idx_discharge_puskesmas on tr_discharge(puskesmas_id);
create index idx_discharge_rs on tr_discharge(rs_asal_id);
create index idx_discharge_waktu_krs on tr_discharge(waktu_krs);
create index idx_alert_terbuka on tr_emergency_alert(discharge_id) where not is_resolved;
create index idx_wa_antrean on log_notifikasi_wa(next_retry_at) where status_pengiriman = 'QUEUED';
create index idx_kelurahan_puskesmas on m_kelurahan(puskesmas_id);

-- =====================================================================
-- LOGIKA BISNIS (PRD bab 7)
-- =====================================================================

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end $$;

create trigger trg_discharge_updated_at before update on tr_discharge
for each row execute function set_updated_at();

-- Saat KRS: hitung T_deadline = T0 + 48 jam, kadaluarsa token 7 hari,
-- dan kunci Puskesmas pembina + Bidan Kelurahan yang bertugas.
create or replace function discharge_sebelum_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    new.deadline_sla := new.waktu_krs + interval '48 hours';
    new.token_expires_at := new.waktu_krs + interval '7 days';
    select puskesmas_id into new.puskesmas_id from m_kelurahan where id = new.kelurahan_id;
    select id into new.bidan_kelurahan_id
      from users
     where role = 'BIDAN_KELURAHAN' and kelurahan_id = new.kelurahan_id and is_active
     order by created_at
     limit 1;
    return new;
end $$;

create trigger trg_discharge_sebelum_insert before insert on tr_discharge
for each row execute function discharge_sebelum_insert();

-- Saat laporan kunjungan masuk: hitung Δt, status SLA, dan triase.
--   Checklist bahaya / suhu > 38°C  -> TANDA_BAHAYA
--   Hanya status "Ada Masalah"      -> KOMPLIKASI
-- Keduanya menyalakan is_emergency dan membuat Red Alert (PRD 7.2).
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

    return new;
end $$;

create trigger trg_home_visit_sebelum_insert before insert on tr_home_visit
for each row execute function home_visit_sebelum_insert();

-- Dipanggil berkala (pg_cron) : tandai NOT_VISITED bila lewat T_deadline tanpa laporan.
create or replace function tandai_tidak_dikunjungi() returns integer
language sql security definer set search_path = public as $$
    with u as (
        update tr_discharge set status_kunjungan = 'NOT_VISITED'
         where status_kunjungan = 'PENDING' and now() > deadline_sla
        returning 1
    )
    select count(*)::int from u;
$$;

-- Soft constraint duplikasi NIK (PRD 7.3): KRS sebelumnya < 40 hari.
create or replace function cek_krs_terakhir(p_nik text)
returns table (discharge_id uuid, nama_ibu varchar, waktu_krs timestamptz)
language sql stable security definer set search_path = public as $$
    select id, nama_ibu, waktu_krs
      from tr_discharge
     where nik = p_nik and waktu_krs > now() - interval '40 days'
     order by waktu_krs desc
     limit 1;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (PRD 2.1)
-- Form kunjungan bertoken & pengiriman WA berjalan di server memakai
-- service_role (melewati RLS), jadi tidak ada policy untuk anon.
-- =====================================================================

create or replace function profil_saya() returns users
language sql stable security definer set search_path = public as $$
    select * from users where id = auth.uid() and is_active;
$$;

-- Apakah pengguna login boleh melihat discharge pada wilayah/RS ini?
create or replace function boleh_lihat_discharge(p_puskesmas uuid, p_kelurahan uuid, p_rs uuid)
returns boolean
language sql stable security definer set search_path = public as $$
    select case p.role
        when 'SUPERADMIN_DINKES' then true
        when 'KEPALA_PUSKESMAS'  then p.puskesmas_id = p_puskesmas
        when 'BIDAN_KELURAHAN'   then p.kelurahan_id = p_kelurahan
        when 'BIDAN_RS'          then p.rumah_sakit_id = p_rs
        else false end
      from profil_saya() p
     where p.id is not null;
$$;

alter table m_puskesmas enable row level security;
alter table m_kelurahan enable row level security;
alter table m_rumah_sakit enable row level security;
alter table users enable row level security;
alter table tr_discharge enable row level security;
alter table tr_home_visit enable row level security;
alter table tr_emergency_alert enable row level security;
alter table log_notifikasi_wa enable row level security;

-- Master: semua pengguna login boleh baca, hanya Dinkes yang menulis.
create policy master_baca on m_puskesmas for select to authenticated using (true);
create policy master_baca on m_kelurahan for select to authenticated using (true);
create policy master_baca on m_rumah_sakit for select to authenticated using (true);
create policy master_tulis on m_puskesmas for all to authenticated
    using ((profil_saya()).role = 'SUPERADMIN_DINKES') with check ((profil_saya()).role = 'SUPERADMIN_DINKES');
create policy master_tulis on m_kelurahan for all to authenticated
    using ((profil_saya()).role = 'SUPERADMIN_DINKES') with check ((profil_saya()).role = 'SUPERADMIN_DINKES');
create policy master_tulis on m_rumah_sakit for all to authenticated
    using ((profil_saya()).role = 'SUPERADMIN_DINKES') with check ((profil_saya()).role = 'SUPERADMIN_DINKES');

-- Users
create policy users_baca on users for select to authenticated
    using (id = auth.uid()
        or (profil_saya()).role = 'SUPERADMIN_DINKES'
        or ((profil_saya()).role = 'KEPALA_PUSKESMAS'
            and kelurahan_id in (select id from m_kelurahan where puskesmas_id = (profil_saya()).puskesmas_id)));
create policy users_kelola on users for all to authenticated
    using ((profil_saya()).role = 'SUPERADMIN_DINKES') with check ((profil_saya()).role = 'SUPERADMIN_DINKES');

-- Discharge
create policy discharge_baca on tr_discharge for select to authenticated
    using (boleh_lihat_discharge(puskesmas_id, kelurahan_id, rs_asal_id));
create policy discharge_input on tr_discharge for insert to authenticated
    with check ((profil_saya()).role = 'BIDAN_RS'
        and bidan_rs_id = auth.uid()
        and rs_asal_id = (profil_saya()).rumah_sakit_id);
-- Pembaruan status lanjutan (DIRAWAT_KEMBALI / MENINGGAL) oleh nakes wilayah.
create policy discharge_update on tr_discharge for update to authenticated
    using ((profil_saya()).role in ('SUPERADMIN_DINKES', 'KEPALA_PUSKESMAS', 'BIDAN_KELURAHAN')
        and boleh_lihat_discharge(puskesmas_id, kelurahan_id, rs_asal_id));

-- Kunjungan rumah & Red Alert: dibaca sesuai cakupan discharge-nya.
create policy visit_baca on tr_home_visit for select to authenticated
    using (exists (select 1 from tr_discharge d where d.id = discharge_id));
create policy alert_baca on tr_emergency_alert for select to authenticated
    using (exists (select 1 from tr_discharge d where d.id = discharge_id));
create policy alert_tindak_lanjut on tr_emergency_alert for update to authenticated
    using ((profil_saya()).role in ('SUPERADMIN_DINKES', 'KEPALA_PUSKESMAS', 'BIDAN_KELURAHAN')
        and exists (select 1 from tr_discharge d where d.id = discharge_id));

-- Log WA: hanya Dinkes.
create policy wa_baca on log_notifikasi_wa for select to authenticated
    using ((profil_saya()).role = 'SUPERADMIN_DINKES');

-- Realtime untuk banner Red Alert & dashboard.
do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        alter publication supabase_realtime add table tr_emergency_alert, tr_discharge;
    end if;
end $$;
