-- Perbaikan dari Supabase security & performance advisor.

-- 1. search_path tetap untuk fungsi trigger.
alter function set_updated_at() set search_path = public;

-- 2. Fungsi SECURITY DEFINER tidak boleh dipanggil anon lewat /rest/v1/rpc.
--    Fungsi trigger tidak perlu hak EXECUTE pemanggil.
revoke execute on function discharge_sebelum_insert() from public, anon, authenticated;
revoke execute on function home_visit_sebelum_insert() from public, anon, authenticated;
-- cek_krs_terakhir membuka nama ibu dari NIK; hanya dipanggil server (service role) setelah cek peran.
revoke execute on function cek_krs_terakhir(text) from public, anon, authenticated;
-- profil_saya & boleh_lihat_discharge dipakai policy RLS, jadi tetap untuk authenticated.
revoke execute on function profil_saya() from public, anon;
revoke execute on function boleh_lihat_discharge(uuid, uuid, uuid) from public, anon;
grant execute on function profil_saya() to authenticated;
grant execute on function boleh_lihat_discharge(uuid, uuid, uuid) to authenticated;
grant execute on function cek_krs_terakhir(text) to service_role;

-- 3. auth.uid() dievaluasi sekali per query, bukan per baris.
drop policy users_baca on users;
create policy users_baca on users for select to authenticated
    using (id = (select auth.uid())
        or (select (profil_saya()).role) = 'SUPERADMIN_DINKES'
        or ((select (profil_saya()).role) = 'KEPALA_PUSKESMAS'
            and kelurahan_id in (select id from m_kelurahan where puskesmas_id = (select (profil_saya()).puskesmas_id))));

drop policy discharge_input on tr_discharge;
create policy discharge_input on tr_discharge for insert to authenticated
    with check ((select (profil_saya()).role) = 'BIDAN_RS'
        and bidan_rs_id = (select auth.uid())
        and rs_asal_id = (select (profil_saya()).rumah_sakit_id));

-- 4. Pisahkan policy tulis per aksi agar SELECT hanya dievaluasi satu policy.
do $$
declare t text;
begin
    foreach t in array array['m_puskesmas', 'm_kelurahan', 'm_rumah_sakit'] loop
        execute format('drop policy master_tulis on %I', t);
        execute format($p$create policy master_tambah on %I for insert to authenticated
            with check ((select (profil_saya()).role) = 'SUPERADMIN_DINKES')$p$, t);
        execute format($p$create policy master_ubah on %I for update to authenticated
            using ((select (profil_saya()).role) = 'SUPERADMIN_DINKES')$p$, t);
        execute format($p$create policy master_hapus on %I for delete to authenticated
            using ((select (profil_saya()).role) = 'SUPERADMIN_DINKES')$p$, t);
    end loop;
end $$;

drop policy users_kelola on users;
create policy users_tambah on users for insert to authenticated
    with check ((select (profil_saya()).role) = 'SUPERADMIN_DINKES');
create policy users_ubah on users for update to authenticated
    using ((select (profil_saya()).role) = 'SUPERADMIN_DINKES');
create policy users_hapus on users for delete to authenticated
    using ((select (profil_saya()).role) = 'SUPERADMIN_DINKES');

-- 5. Index foreign key.
create index idx_wa_discharge on log_notifikasi_wa(discharge_id);
create index idx_discharge_bidan_kelurahan on tr_discharge(bidan_kelurahan_id);
create index idx_discharge_bidan_rs on tr_discharge(bidan_rs_id);
create index idx_alert_resolved_by on tr_emergency_alert(resolved_by);
create index idx_visit_bidan on tr_home_visit(bidan_pelaksana_id);
create index idx_users_kelurahan on users(kelurahan_id);
create index idx_users_puskesmas on users(puskesmas_id);
create index idx_users_rs on users(rumah_sakit_id);
