-- =====================================================================
-- SIM-NIFAS Surabaya — Optimasi Indeks & Agregasi Analitik (v2.0)
-- 1. Composite indexes untuk pola query filter faskes/status + waktu KRS
-- 2. Index pengurutan banner Red Alert terbuka
-- 3. Fungsi RPC hitung_analitik_dashboard untuk agregasi langsung di Postgres
-- =====================================================================

-- 1. COMPOSITE INDEXES -------------------------------------------------

-- Optimasi filter Puskesmas / Kelurahan + pengurutan kronologis kepulangan
create index if not exists idx_discharge_pkm_waktu on tr_discharge(puskesmas_id, waktu_krs desc);
create index if not exists idx_discharge_kel_waktu on tr_discharge(kelurahan_id, waktu_krs desc);

-- Optimasi tab filter KPI (status SLA kunjungan & status kesehatan ibu)
create index if not exists idx_discharge_status_kunjungan_waktu on tr_discharge(status_kunjungan, waktu_krs desc);
create index if not exists idx_discharge_status_kesehatan_waktu on tr_discharge(status_kesehatan, waktu_krs desc);

-- Optimasi query Red Alert aktif: menghindari in-memory sorting pada waktu_laporan
create index if not exists idx_alert_aktif_terbaru on tr_emergency_alert(waktu_laporan desc) where not is_resolved;


-- 2. FUNGSI RPC AGREGASI ANALITIK -------------------------------------
-- Menggantikan penarikan hingga 10.000 baris mentah ke server Next.js.
-- Berjalan dengan SECURITY INVOKER sehingga otomatis mematuhi RLS profil_saya().

create or replace function hitung_analitik_dashboard(
    p_mulai timestamptz,
    p_selesai timestamptz,
    p_puskesmas uuid default null,
    p_kelurahan uuid default null
)
returns json
language plpgsql
security invoker
set search_path = public
as $$
declare
    v_total bigint;
    v_tepat bigint;
    v_menunggu bigint;
    v_tidak_dikunjungi bigint;
    v_terlambat bigint;
    v_komplikasi bigint;
    v_tanda_bahaya bigint;
    v_meninggal bigint;
    v_sehat bigint;
    v_dirawat_kembali bigint;
    v_persentase numeric;
    v_chart_series json;
begin
    -- 1. Hitung 10 indikator KPI dalam 1 pemindaian tabel terindeks
    select
        count(*),
        count(*) filter (where status_kunjungan = 'VISITED_ON_TIME'),
        count(*) filter (where status_kunjungan = 'PENDING'),
        count(*) filter (where status_kunjungan = 'NOT_VISITED'),
        count(*) filter (where status_kunjungan = 'VISITED_LATE'),
        count(*) filter (where status_kesehatan = 'KOMPLIKASI'),
        count(*) filter (where status_kesehatan = 'TANDA_BAHAYA'),
        count(*) filter (where status_kesehatan = 'MENINGGAL'),
        count(*) filter (where status_kesehatan = 'SEHAT'),
        count(*) filter (where status_kesehatan = 'DIRAWAT_KEMBALI')
    into
        v_total,
        v_tepat,
        v_menunggu,
        v_tidak_dikunjungi,
        v_terlambat,
        v_komplikasi,
        v_tanda_bahaya,
        v_meninggal,
        v_sehat,
        v_dirawat_kembali
    from tr_discharge
    where waktu_krs >= p_mulai
      and waktu_krs < p_selesai
      and (p_puskesmas is null or puskesmas_id = p_puskesmas)
      and (p_kelurahan is null or kelurahan_id = p_kelurahan);

    v_persentase := case
        when v_total > 0 then round((v_tepat::numeric / v_total::numeric) * 1000) / 10.0
        else 0
    end;

    -- 2. Agregasi titik grafik per hari menurut zona waktu Asia/Jakarta (WIB)
    select coalesce(
        json_agg(
            json_build_object(
                'tanggal', to_char(d, 'YYYY-MM-DD'),
                'dipulangkan', coalesce(agg.dipulangkan, 0),
                'tepat_waktu', coalesce(agg.tepat_waktu, 0),
                'tidak_kunjungan', coalesce(agg.tidak_kunjungan, 0),
                'terlambat', coalesce(agg.terlambat, 0)
            )
            order by d
        ),
        '[]'::json
    )
    into v_chart_series
    from generate_series(
        date_trunc('day', p_mulai at time zone 'Asia/Jakarta'),
        date_trunc('day', (p_selesai - interval '1 second') at time zone 'Asia/Jakarta'),
        interval '1 day'
    ) d
    left join (
        select
            date_trunc('day', waktu_krs at time zone 'Asia/Jakarta') as tgl,
            count(*) as dipulangkan,
            count(*) filter (where status_kunjungan = 'VISITED_ON_TIME') as tepat_waktu,
            count(*) filter (where status_kunjungan = 'NOT_VISITED') as tidak_kunjungan,
            count(*) filter (where status_kunjungan = 'VISITED_LATE') as terlambat
        from tr_discharge
        where waktu_krs >= p_mulai
          and waktu_krs < p_selesai
          and (p_puskesmas is null or puskesmas_id = p_puskesmas)
          and (p_kelurahan is null or kelurahan_id = p_kelurahan)
        group by 1
    ) agg on agg.tgl = d;

    return json_build_object(
        'metrics', json_build_object(
            'total_dipulangkan', v_total,
            'kunjungan_tepat_waktu', v_tepat,
            'persentase_tepat_waktu', v_persentase,
            'menunggu_kunjungan', v_menunggu,
            'tidak_dikunjungi', v_tidak_dikunjungi,
            'kunjungan_terlambat', v_terlambat,
            'komplikasi', v_komplikasi,
            'tanda_bahaya', v_tanda_bahaya,
            'meninggal', v_meninggal,
            'sehat', v_sehat,
            'dirawat_kembali', v_dirawat_kembali
        ),
        'chart_series', v_chart_series
    );
end;
$$;

-- Izin pemanggilan: authenticated (nakes login) & service_role
grant execute on function hitung_analitik_dashboard(timestamptz, timestamptz, uuid, uuid) to authenticated, service_role;
