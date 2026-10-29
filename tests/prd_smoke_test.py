import sys
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.main import app
from app.db.session import engine, init_db
from app.db.prd_seed import seed_prd_data
from app.models.prd_models import (
    MKelurahan,
    MRumahSakit,
    TrDischarge,
    TrHomeVisit,
    TrEmergencyAlert,
    LogNotifikasiWA,
)

client = TestClient(app)


def run_prd_smoke_test():
    print("=== [SMOKE TEST] PRD SIM-NIFAS DISCHARGE & HOME VISIT SURABAYA ===")

    # 1. Inisialisasi basis data & seed
    init_db()
    seed_prd_data()

    # 2. Test Master Data Wilayah & RS
    res_wilayah = client.get("/api/v1/master/wilayah")
    assert res_wilayah.status_code == 200, f"Gagal get wilayah: {res_wilayah.text}"
    wilayah_data = res_wilayah.json()
    assert wilayah_data["success"] is True
    assert len(wilayah_data["data"]) >= 6, "Kecamatan percontohan harus minimal 6"
    assert len(wilayah_data["raw_kelurahan"]) >= 20, "Kelurahan harus terdaftar"
    print(f"[1] Master wilayah verified: {len(wilayah_data['data'])} Kecamatan, {len(wilayah_data['raw_kelurahan'])} Kelurahan.")

    res_rs = client.get("/api/v1/master/rumah-sakit")
    assert res_rs.status_code == 200
    rs_data = res_rs.json()
    assert len(rs_data["data"]) >= 6, "RS Rujukan harus terdaftar minimal 6"
    print(f"[2] Master RS verified: {len(rs_data['data'])} Rumah Sakit Rujukan.")

    # Ambil sampel kelurahan dan RS
    sample_kel = wilayah_data["raw_kelurahan"][0]
    sample_rs = rs_data["data"][0]

    # 3. Test FR-01: Bidan RS Submit Pemulangan Pasien (KRS)
    discharge_payload = {
        "nik": "3578099887760001",
        "nama_ibu": "Ny. Arini Megawati",
        "alamat_lengkap": "Jl. Kedung Doro Gang 4 No. 12, Surabaya",
        "kelurahan_id": sample_kel["id"],
        "no_whatsapp_ibu": "081234999888",
        "diagnosis_sebelum_pulang": "Post partum spontan H-2",
        "diagnosis_perawatan": "Perawatan perineum derajat 2",
        "rekomendasi_perawatan_rumah": "Mobilisasi dini, konsumsi protein dan tablet tambah darah",
        "jadwal_kunjungan_ulang": (date.today() + timedelta(days=6)).isoformat(),
        "faskes_kunjungan_ulang": "PUSKESMAS",
        "rs_asal_id": sample_rs["id"],
    }

    res_post_d = client.post("/api/v1/discharge", json=discharge_payload)
    assert res_post_d.status_code == 201, f"Gagal create discharge: {res_post_d.text}"
    d_res = res_post_d.json()
    assert d_res["success"] is True
    token_kunjungan = d_res["data"]["token_kunjungan"]
    discharge_id = d_res["data"]["discharge_id"]
    assert token_kunjungan is not None
    assert "deadline_sla" in d_res["data"]
    print(f"[3] FR-01 Discharge KRS sukses: Pasien {d_res['data']['nama_ibu']} (Token: {token_kunjungan[:8]}...)")

    # 4. Verifikasi Notifikasi WhatsApp Audit Log terpicu
    with Session(engine) as s:
        logs = s.exec(
            select(LogNotifikasiWA).where(LogNotifikasiWA.discharge_id == discharge_id)
        ).all()
        assert len(logs) >= 2, "Harus ada log notifikasi WA-ASSIGN-01 dan WA-EDU-PASIEN"
        template_ids = [l.template_id for l in logs]
        assert "WA-ASSIGN-01" in template_ids
        assert "WA-EDU-PASIEN" in template_ids
    print(f"[4] Verifikasi WhatsApp Gateway: {len(logs)} notifikasi transaksional terkirim & tercatat.")

    # 5. Test FR-03: Bidan Kelurahan Buka Form via URL Token
    res_token = client.get(f"/api/v1/visit/{token_kunjungan}")
    assert res_token.status_code == 200, f"Gagal get visit by token: {res_token.text}"
    visit_form_data = res_token.json()["data"]
    assert visit_form_data["nama_ibu"] == "Ny. Arini Megawati"
    assert visit_form_data["is_submitted"] is False
    print(f"[5] FR-03 Token access valid: Bidan membuka form pasien {visit_form_data['nama_ibu']}.")

    # 6. Test FR-04: Bidan Kelurahan Submit Hasil Kunjungan (Kondisi Tanda Bahaya -> Red Alert)
    visit_submit_payload = {
        "token_kunjungan": token_kunjungan,
        "suhu_tubuh": 38.7,
        "perdarahan_abnormal": True,
        "nyeri_perut_hebat": True,
        "luka_berbau_infeksi": False,
        "pusing_muntah_lemas": True,
        "status_hasil": "ADA_MASALAH",
        "catatan_kebidanan": "Pasien demam tinggi 38.7C, lokia berdarah deras dan menggigil.",
        "konfirmasi_jadwal_kontrol": (date.today() + timedelta(days=1)).isoformat(),
    }

    res_submit = client.post("/api/v1/visit/submit", json=visit_submit_payload)
    assert res_submit.status_code == 200, f"Gagal submit visit: {res_submit.text}"
    sub_data = res_submit.json()["data"]
    assert sub_data["status_sla"] == "VISITED_ON_TIME"
    assert sub_data["status_kesehatan"] == "TANDA_BAHAYA"
    assert sub_data["is_emergency_triggered"] is True
    print(f"[6] FR-04 Triase & Alert sukses: Status TANDA_BAHAYA + Red Alert terpicu otomatis!")

    # 7. Verifikasi Log Notifikasi WA-EMERGENCY
    with Session(engine) as s:
        emergency_log = s.exec(
            select(LogNotifikasiWA).where(
                LogNotifikasiWA.discharge_id == discharge_id,
                LogNotifikasiWA.template_id == "WA-EMERGENCY",
            )
        ).first()
        assert emergency_log is not None, "Log WA-EMERGENCY harus tercipta saat tanda bahaya"
    print(f"[7] Notifikasi darurat WA-EMERGENCY terkirim ke WhatsApp Bidan & Kapus.")

    # 8. Test FR-05 & Section 8.1: Dashboard Eksekutif 10 Kartu Indikator KPI
    res_analytics = client.get("/api/v1/dashboard/analytics")
    assert res_analytics.status_code == 200
    analytics_data = res_analytics.json()["data"]
    metrics = analytics_data["metrics"]
    
    assert "total_dipulangkan" in metrics
    assert "kunjungan_tepat_waktu" in metrics
    assert "persentase_tepat_waktu" in metrics
    assert "tidak_dikunjungi" in metrics
    assert "kunjungan_terlambat" in metrics
    assert "komplikasi" in metrics
    assert "tanda_bahaya" in metrics
    assert "meninggal" in metrics
    assert "sehat" in metrics
    assert "dirawat_kembali" in metrics

    assert metrics["total_dipulangkan"] >= 7
    assert metrics["tanda_bahaya"] >= 2  # Termasuk kasus baru
    assert len(analytics_data["floating_red_alerts"]) >= 2
    assert len(analytics_data["chart_series"]) == 7
    assert len(analytics_data["health_donut"]) == 5
    print(f"[8] FR-05 Dashboard 10 KPI & Visualisasi terverifikasi: Total KRS {metrics['total_dipulangkan']}, On-Time {metrics['persentase_tepat_waktu']}%, Red Alert Aktif: {len(analytics_data['floating_red_alerts'])}.")

    # 9. Test Discharges Operational List
    res_list = client.get("/api/v1/discharges")
    assert res_list.status_code == 200
    discharges_list = res_list.json()["data"]
    assert len(discharges_list) >= 7
    print(f"[9] Daftar operasional discharge terverifikasi ({len(discharges_list)} baris).")

    # 10. Test Penyelesaian Red Alert (Resolve)
    active_alert = analytics_data["floating_red_alerts"][0]
    res_resolve = client.post(
        "/api/v1/emergency-alert/resolve",
        json={
            "alert_id": active_alert["alert_id"],
            "catatan_tindakan": "Pasien telah dijemput ambulans 112 dan mendapatkan penanganan di IGD RSUD Dr. Soetomo.",
        },
    )
    assert res_resolve.status_code == 200
    print(f"[10] Penanganan Red Alert sukses diselesaikan.")

    print("\n=== SEMUA 10 PENGUJIAN SMOKE TEST PRD LULUS DENGAN SUKSES! ===")


if __name__ == "__main__":
    run_prd_smoke_test()
