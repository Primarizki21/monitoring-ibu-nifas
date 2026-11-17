-- =====================================================================
-- AUDIT LOG TINDAKAN ADMIN DINKES
-- Mencatat perubahan master faskes dan akun tenaga kesehatan (PRD §4).
-- =====================================================================

create table log_audit_admin (
    id bigint generated always as identity primary key,
    aktor_id uuid references users(id) on delete set null,
    aktor_nama varchar(150) not null,
    aktor_role role_pengguna not null,
    aksi varchar(40) not null,
    target_tabel varchar(60) not null,
    target_id uuid,
    detail jsonb,
    created_at timestamptz not null default now()
);

create index idx_audit_admin_waktu on log_audit_admin (created_at desc);
create index idx_audit_admin_aktor on log_audit_admin (aktor_id);

alter table log_audit_admin enable row level security;

-- Hanya Dinkes yang boleh membaca. Tanpa policy insert/update/delete:
-- entri ditulis server memakai service_role, jadi browser tidak bisa memalsukan audit.
create policy audit_admin_baca on log_audit_admin for select to authenticated
    using ((profil_saya()).role = 'SUPERADMIN_DINKES');
