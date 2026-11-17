-- Data migration: kunci acak dibuat sekali per database, lalu baris lama dienkripsi.
-- Data baru sudah dienkripsi oleh trigger pada migrasi sebelumnya.
do $$
begin
    if not exists (select 1 from vault.decrypted_secrets where name = 'nifas_encryption_key') then
        perform vault.create_secret(
            encode(extensions.gen_random_bytes(32), 'hex'),
            'nifas_encryption_key',
            'Kunci AES-256 untuk kolom sensitif SIM-NIFAS'
        );
    end if;
end $$;

-- Semua ekspresi SET membaca nilai lama, jadi hash dihitung dari NIK plaintext.
update tr_discharge
   set nik_hash = hash_nik(nik),
       nik = enkripsi_nifas(nik),
       no_whatsapp_ibu = enkripsi_nifas(no_whatsapp_ibu),
       diagnosis_sebelum_pulang = enkripsi_nifas(diagnosis_sebelum_pulang),
       diagnosis_perawatan = enkripsi_nifas(diagnosis_perawatan),
       rekomendasi_perawatan_rumah = enkripsi_nifas(rekomendasi_perawatan_rumah)
 where nik_hash is null;

update tr_home_visit
   set catatan_kebidanan = enkripsi_nifas(catatan_kebidanan)
 where catatan_kebidanan is not null;

update log_notifikasi_wa
   set pesan_terkirim = enkripsi_nifas(pesan_terkirim)
 where pesan_terkirim is not null;
