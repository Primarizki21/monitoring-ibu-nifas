import os
import sys
import uuid
sys.path.insert(0, os.path.abspath("."))
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.db.seed import seed_database
from app.db.session import engine
from app.main import app
from app.models.enums import DeliveryType, MilestoneKF, StatusPemantauan, TriageResult
from app.models.mother import Mother
from app.models.screening import ScreeningSchedule

client = TestClient(app)


def run_smoke_tests():
    print("=== [SMOKE TEST] SISTEM MONITORING NIFAS SURABAYA ===")

    # 1. Bersihkan database dev untuk pengujian deterministik yang bersih
    if os.path.exists("nifas_dev.db"):
        os.remove("nifas_dev.db")

    # 2. Jalankan seeder
    seed_database()
    # 2. Test Endpoint Root & Health
    print("[1] Menguji endpoint /health dan /...")
    res_health = client.get("/health")
    assert res_health.status_code == 200, f"Health check gagal: {res_health.text}"
    health_json = res_health.json()
    assert health_json["status"] == "healthy"
    print(f"    -> Status sehat: {health_json}")

    # 3. Test Daftar 13 Faskes Surabaya
    print("[2] Menguji endpoint /api/v1/faskes (13 RS & Puskesmas)...")
    res_faskes = client.get("/api/v1/faskes")
    assert res_faskes.status_code == 200
    faskes_list = res_faskes.json()
    assert len(faskes_list) == 13, f"Jumlah faskes harus 13, ditemukan: {len(faskes_list)}"
    print(f"    -> Terverifikasi 13 Faskes Surabaya (3 RSUD + 10 Puskesmas)")

    # 4. Test Tenant Data Scoping (Isolasi Data Faskes)
    print("[3] Menguji isolasi tenant via X-Faskes-ID header...")
    # Akses tanpa header (Super Admin Dinkes)
    res_all_mothers = client.get("/api/v1/mothers")
    assert res_all_mothers.status_code == 200
    total_mothers = len(res_all_mothers.json())
    assert total_mothers >= 3, "Harus ada minimal 3 ibu dari seeder"

    # Akses dengan header Puskesmas Jagir (ID: 4)
    res_jagir_mothers = client.get("/api/v1/mothers", headers={"X-Faskes-ID": "4"})
    assert res_jagir_mothers.status_code == 200
    jagir_mothers = res_jagir_mothers.json()
    assert len(jagir_mothers) == 1, f"Pasien Jagir harus 1, ditemukan: {len(jagir_mothers)}"
    assert jagir_mothers[0]["nama_ibu"] == "Ny. Dewi Lestari"
    print("    -> Isolasi tenant terbukti: Puskesmas Jagir hanya melihat 1 pasien binaannya.")

    # 5. Test Pendaftaran Pasien Baru (Discharge Planning Onboarding)
    print("[4] Menguji pendaftaran pasien baru (Discharge Planning)...")
    new_mother_payload = {
        "faskes_id": 4,
        "nik": "3578051204990005",
        "no_rm": "RM-2026-0999",
        "nama_ibu": "Ny. Maya Safitri",
        "no_wa_ibu": "081239998888",
        "waktu_persalinan": datetime.now(timezone.utc).isoformat(),
        "metode_persalinan": "SPONTAN",
        "paritas": "P1A0",
        "status_pemantauan": "ONBOARDING_PENDING",
        "nama_suami": "Bpk. Rahmat Santoso",
        "no_wa_suami": "081239997777",
        "hubungan": "SUAMI",
    }
    res_reg = client.post("/api/v1/mothers", json=new_mother_payload)
    assert res_reg.status_code == 201, f"Pendaftaran gagal: {res_reg.text}"
    created_mother = res_reg.json()
    mother_id = uuid.UUID(created_mother["id"])
    print(f"    -> Pasien terdaftar: {created_mother['nama_ibu']} (ID: {mother_id})")

    # Verifikasi bahwa 4 jadwal KF1-KF4 dibuat otomatis
    with Session(engine) as session:
        scheds = session.exec(
            select(ScreeningSchedule).where(ScreeningSchedule.mother_id == mother_id)
        ).all()
        assert len(scheds) == 4, f"Harus ada 4 jadwal KF, ditemukan: {len(scheds)}"
        milestones = [s.milestone for s in scheds]
        assert MilestoneKF.KF1 in milestones
        assert MilestoneKF.KF4 in milestones
    print("    -> 4 Jadwal KF1-KF4 berhasil digenerate otomatis di database.")

    # 6. Test Meta Webhook Verification Challenge (GET)
    print("[5] Menguji Meta Webhook Challenge verification (GET)...")
    res_hub = client.get(
        "/api/v1/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "1234567890",
            "hub.verify_token": "surabaya_nifas_webhook_verify_secret",
        },
    )
    assert res_hub.status_code == 200
    assert res_hub.text == "1234567890"
    print("    -> Webhook challenge token berhasil lolos verifikasi.")

    # 7. Test Inbound WhatsApp Message: Onboarding 'YA'
    print("[6] Menguji balasan pasien via Webhook WhatsApp (Onboarding 'YA')...")
    res_wa_onboard = client.post(
        "/api/v1/webhook",
        json={"from": "081239998888", "text": "YA saya setuju bu"},
    )
    assert res_wa_onboard.status_code == 200
    assert res_wa_onboard.json()["status"] == "onboarded_active"

    # Cek status pasien berubah jadi AKTIF
    with Session(engine) as session:
        m_check = session.get(Mother, mother_id)
        assert m_check.status_pemantauan == StatusPemantauan.AKTIF
    print("    -> Pasien berhasil bertransisi status: ONBOARDING_PENDING -> AKTIF.")

    # 8. Test Inbound WhatsApp Message: Skrining KF1 Bahaya (Pilihan 2 -> MERAH)
    print("[7] Menguji evaluasi triase deterministik (Opsi 2 -> MERAH)...")
    res_wa_kf1 = client.post(
        "/api/v1/webhook",
        json={"from": "081239998888", "text": "2"},
    )
    assert res_wa_kf1.status_code == 200
    kf1_res = res_wa_kf1.json()
    assert kf1_res["status"] == "triage_evaluated"
    assert kf1_res["triage_result"] == TriageResult.MERAH
    print(f"    -> Triase sukses: Opsi 2 dievaluasi sebagai MERAH.")

    # 9. Test Antrean Triase Bidan & Direct wa.me
    print("[8] Menguji antrean triase harian (/api/v1/triage/queue)...")
    res_queue = client.get("/api/v1/triage/queue")
    assert res_queue.status_code == 200
    queue = res_queue.json()
    assert len(queue) > 0
    first_item = queue[0]
    assert first_item["triage_result"] == TriageResult.MERAH, "Urutan prioritas pertama harus MERAH"
    assert "https://wa.me/" in first_item["wa_me_mother_url"]
    assert "https://wa.me/" in first_item["wa_me_husband_url"]
    print(f"    -> Prioritas queue: {first_item['triage_result']} ({first_item['nama_ibu']})")
    print(f"    -> Format wa.me Ibu: {first_item['wa_me_mother_url'][:60]}...")
    print(f"    -> Format wa.me Suami: {first_item['wa_me_husband_url'][:60]}...")

    # 10. Test Catat Tindakan Bidan & Audit Logging
    print("[9] Menguji pencatatan intervensi bidan (/api/v1/triage/interventions)...")
    intervention_payload = {
        "mother_id": str(mother_id),
        "screening_log_id": None,
        "triase_level": "MERAH",
        "jenis_tindakan": "WA_ANAMNESIS",
        "catatan_klinis": "Sudah dihubungi via WA. Pasien disarankan langsung periksa ke IGD RSUD.",
        "status_kasus": "RESOLVED",
    }
    res_interv = client.post("/api/v1/triage/interventions", json=intervention_payload)
    assert res_interv.status_code == 201
    print("    -> Tindakan bidan berhasil dicatat beserta audit log.")

    print("\n=== SEMUA 9 SMOKE TEST LULUS DENGAN SUKSES! ===")


if __name__ == "__main__":
    try:
        run_smoke_tests()
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
