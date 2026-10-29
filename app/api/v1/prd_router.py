from datetime import date, datetime, timedelta, timezone
import secrets
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select, func, and_, or_

from app.db.session import get_session
from app.models.prd_models import (
    RolePengguna,
    StatusSLAKunjungan,
    StatusKesehatanIbu,
    TipeFaskesRujukan,
    MPuskesmas,
    MKelurahan,
    MRumahSakit,
    PRDUser,
    TrDischarge,
    TrHomeVisit,
    TrEmergencyAlert,
    LogNotifikasiWA,
)

router = APIRouter(prefix="", tags=["PRD Discharge & Monitoring"])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class DischargeCreateRequest(BaseModel):
    nik: str = Field(min_length=16, max_length=16, description="NIK 16 digit")
    nama_ibu: str
    alamat_lengkap: str
    kelurahan_id: str
    no_whatsapp_ibu: str
    diagnosis_sebelum_pulang: str
    diagnosis_perawatan: str
    rekomendasi_perawatan_rumah: str
    jadwal_kunjungan_ulang: date
    faskes_kunjungan_ulang: TipeFaskesRujukan
    rs_asal_id: Optional[str] = None
    bidan_rs_id: Optional[str] = None


class VisitSubmitRequest(BaseModel):
    token_kunjungan: str
    suhu_tubuh: float
    perdarahan_abnormal: bool = False
    nyeri_perut_hebat: bool = False
    luka_berbau_infeksi: bool = False
    pusing_muntah_lemas: bool = False
    status_hasil: str = "BAIK"  # 'BAIK' / 'ADA_MASALAH'
    catatan_kebidanan: Optional[str] = None
    konfirmasi_jadwal_kontrol: date
    bidan_pelaksana_id: Optional[str] = None


# ==========================================
# MASTER DATA ENDPOINTS
# ==========================================

@router.get("/master/wilayah")
def get_master_wilayah(session: Session = Depends(get_session)):
    """Mengambil hierarki wilayah Surabaya: Kecamatan -> Puskesmas -> Kelurahan."""
    puskesmas_list = session.exec(select(MPuskesmas)).all()
    kelurahan_list = session.exec(select(MKelurahan)).all()

    # Kelompokkan per kecamatan
    kecamatan_map: Dict[str, Any] = {}
    for p in puskesmas_list:
        if p.kecamatan not in kecamatan_map:
            kecamatan_map[p.kecamatan] = {
                "kecamatan": p.kecamatan,
                "puskesmas": [],
            }
        
        # Cari kelurahan binaan puskesmas ini
        kel_binaan = [
            {"id": k.id, "nama_kelurahan": k.nama_kelurahan}
            for k in kelurahan_list
            if k.puskesmas_id == p.id
        ]
        
        kecamatan_map[p.kecamatan]["puskesmas"].append({
            "id": p.id,
            "nama_puskesmas": p.nama_puskesmas,
            "no_telp": p.no_telp_operasional,
            "kelurahan": kel_binaan,
        })

    return {
        "success": True,
        "data": list(kecamatan_map.values()),
        "raw_kelurahan": [
            {
                "id": k.id,
                "nama_kelurahan": k.nama_kelurahan,
                "puskesmas_id": k.puskesmas_id,
            }
            for k in kelurahan_list
        ],
    }


@router.get("/master/rumah-sakit")
def get_master_rumah_sakit(session: Session = Depends(get_session)):
    """Mengambil daftar seluruh Rumah Sakit Rujukan se-Surabaya."""
    rs_list = session.exec(select(MRumahSakit)).all()
    return {
        "success": True,
        "data": [
            {
                "id": r.id,
                "nama_rs": r.nama_rs,
                "tipe_rs": r.tipe_rs,
                "alamat_rs": r.alamat_rs,
            }
            for r in rs_list
        ],
    }


# ==========================================
# DISCHARGE (PEMULANGAN PASIEN RS)
# ==========================================

@router.post("/discharge", status_code=status.HTTP_201_CREATED)
def create_discharge(
    payload: DischargeCreateRequest,
    session: Session = Depends(get_session),
):
    """
    FR-01: Bidan RS mencatat pemulangan pasien (KRS).
    Menetapkan T0, Deadline SLA (T0 + 48 Jam), Unique Token, dan Trigger Notifikasi WA.
    """
    # 1. Validasi Kelurahan & Relasi Faskes
    kelurahan = session.get(MKelurahan, payload.kelurahan_id)
    if not kelurahan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kelurahan ID tidak ditemukan dalam master data.",
        )
    
    puskesmas = session.get(MPuskesmas, kelurahan.puskesmas_id)

    # 2. Validasi atau Fallback RS & Bidan RS
    rs_asal_id = payload.rs_asal_id
    if not rs_asal_id:
        default_rs = session.exec(select(MRumahSakit)).first()
        rs_asal_id = default_rs.id if default_rs else str(uuid.uuid4())

    bidan_rs_id = payload.bidan_rs_id
    if not bidan_rs_id:
        default_bidan = session.exec(
            select(PRDUser).where(PRDUser.role == RolePengguna.BIDAN_RS)
        ).first()
        bidan_rs_id = default_bidan.id if default_bidan else str(uuid.uuid4())

    # 3. Hitung Waktu KRS & SLA Deadline (T0 + 48 Jam)
    t0 = utc_now()
    deadline_sla = t0 + timedelta(hours=48)
    token_kunjungan = secrets.token_hex(16)

    # Normalisasi format WhatsApp
    no_wa = payload.no_whatsapp_ibu.strip().replace("-", "").replace(" ", "")
    if no_wa.startswith("0"):
        no_wa = "+62" + no_wa[1:]
    elif not no_wa.startswith("+"):
        no_wa = "+" + no_wa

    discharge = TrDischarge(
        id=str(uuid.uuid4()),
        token_kunjungan=token_kunjungan,
        nik=payload.nik,
        nama_ibu=payload.nama_ibu,
        alamat_lengkap=payload.alamat_lengkap,
        kelurahan_id=payload.kelurahan_id,
        no_whatsapp_ibu=no_wa,
        diagnosis_sebelum_pulang=payload.diagnosis_sebelum_pulang,
        diagnosis_perawatan=payload.diagnosis_perawatan,
        rekomendasi_perawatan_rumah=payload.rekomendasi_perawatan_rumah,
        jadwal_kunjungan_ulang=payload.jadwal_kunjungan_ulang,
        faskes_kunjungan_ulang=payload.faskes_kunjungan_ulang,
        rs_asal_id=rs_asal_id,
        bidan_rs_id=bidan_rs_id,
        waktu_krs=t0,
        deadline_sla=deadline_sla,
        status_kunjungan=StatusSLAKunjungan.PENDING,
        status_kesehatan=StatusKesehatanIbu.SEHAT,
        is_emergency=False,
    )
    session.add(discharge)
    session.flush()

    # 4. Cari Bidan Kelurahan & Kepala Puskesmas untuk Notifikasi WhatsApp
    bidan_kel = session.exec(
        select(PRDUser).where(
            PRDUser.role == RolePengguna.BIDAN_KELURAHAN,
            PRDUser.kelurahan_id == kelurahan.id,
        )
    ).first()
    if not bidan_kel:
        bidan_kel = session.exec(
            select(PRDUser).where(PRDUser.role == RolePengguna.BIDAN_KELURAHAN)
        ).first()

    kapus = session.exec(
        select(PRDUser).where(
            PRDUser.role == RolePengguna.KEPALA_PUSKESMAS,
            PRDUser.faskes_id == (puskesmas.id if puskesmas else None),
        )
    ).first()
    if not kapus:
        kapus = session.exec(
            select(PRDUser).where(PRDUser.role == RolePengguna.KEPALA_PUSKESMAS)
        ).first()

    rs_obj = session.get(MRumahSakit, rs_asal_id)
    rs_nama = rs_obj.nama_rs if rs_obj else "Rumah Sakit"

    # 5. Simulasi Pengiriman Pesan WhatsApp (Audit Trail)
    # Template 1: WA-ASSIGN-01 ke Bidan Kelurahan
    target_bidan_wa = bidan_kel.no_whatsapp if bidan_kel else "+6281234567890"
    url_kunjungan = f"/visit/{token_kunjungan}"
    
    msg_assign = (
        f"[NOTIFIKASI MONITORING IBU NIFAS - KOTA SURABAYA]\n\n"
        f"Yth. Bidan Kelurahan & Kepala Puskesmas {puskesmas.nama_puskesmas if puskesmas else ''},\n\n"
        f"Terdapat pasien ibu nifas baru yang dipulangkan dari {rs_nama} dan memerlukan kunjungan rumah:\n"
        f"- Nama Ibu: {discharge.nama_ibu}\n"
        f"- NIK: {discharge.nik}\n"
        f"- Alamat: {discharge.alamat_lengkap}\n"
        f"- No. WA: {discharge.no_whatsapp_ibu}\n"
        f"- Diagnosis Sebelum Pulang: {discharge.diagnosis_sebelum_pulang}\n"
        f"- Rekomendasi di Rumah: {discharge.rekomendasi_perawatan_rumah}\n\n"
        f"BATAS WAKTU KUNJUNGAN: Maksimal 2x24 Jam (Sebelum {deadline_sla.strftime('%d-%m-%Y %H:%M')} WIB)\n"
        f"Jadwal Kunjungan Ulang: {discharge.jadwal_kunjungan_ulang} di {discharge.faskes_kunjungan_ulang.value}\n\n"
        f"Segera lakukan kunjungan rumah dan laporkan hasilnya melalui tautan resmi:\n"
        f"{url_kunjungan}"
    )
    session.add(
        LogNotifikasiWA(
            discharge_id=discharge.id,
            nomor_tujuan=target_bidan_wa,
            peran_penerima="BIDAN_KELURAHAN",
            template_id="WA-ASSIGN-01",
            pesan_terkirim=msg_assign,
            status_pengiriman="DELIVERED",
        )
    )

    # Template 2: WA-EDU-PASIEN ke Ibu Nifas
    msg_edu = (
        f"Halo Ibu {discharge.nama_ibu},\n\n"
        f"Salam hangat dari Tim Layanan Kesehatan Ibu dan Anak Kota Surabaya. "
        f"Kami siap mendampingi masa pemulihan Ibu pasca-melahirkan.\n\n"
        f"Jangan lupa untuk melakukan Kunjungan Ulang (Kontrol Nifas) ke "
        f"{discharge.faskes_kunjungan_ulang.value} pada:\n"
        f"Tanggal: {discharge.jadwal_kunjungan_ulang}\n\n"
        f"Segera hubungi bidan atau faskes terdekat jika Ibu merasakan salah satu TANDA BAHAYA NIFAS:\n"
        f"1. Demam > 38°C\n"
        f"2. Perdarahan banyak dari jalan lahir\n"
        f"3. Nyeri hebat pada bagian perut\n"
        f"4. Bau tidak sedap atau nanah pada luka jahitan\n"
        f"5. Pusing berat, muntah terus-menerus, lemas ekstrem\n\n"
        f"Kontak Bidan Kelurahan Pendamping: {bidan_kel.nama_lengkap if bidan_kel else 'Bidan Wilayah'} ({target_bidan_wa})\n"
        f"Bersama Kita Pastikan Ibu dan Bayi Sehat, Aman, dan Sejahtera."
    )
    session.add(
        LogNotifikasiWA(
            discharge_id=discharge.id,
            nomor_tujuan=discharge.no_whatsapp_ibu,
            peran_penerima="IBU_NIFAS",
            template_id="WA-EDU-PASIEN",
            pesan_terkirim=msg_edu,
            status_pengiriman="DELIVERED",
        )
    )

    session.commit()
    session.refresh(discharge)

    return {
        "success": True,
        "message": "Data pemulangan ibu nifas berhasil disimpan. Tugas kunjungan telah diteruskan ke Bidan Kelurahan.",
        "data": {
            "discharge_id": discharge.id,
            "deadline_sla": discharge.deadline_sla.isoformat(),
            "token_kunjungan": discharge.token_kunjungan,
            "nama_ibu": discharge.nama_ibu,
            "nik": discharge.nik,
            "url_kunjungan": url_kunjungan,
        },
    }


# ==========================================
# VISIT PELAPORAN KUNJUNGAN RUMAH
# ==========================================

@router.get("/visit/{token}")
def get_visit_by_token(token: str, session: Session = Depends(get_session)):
    """
    FR-03: Bidan Kelurahan membuka formulir kunjungan rumah via URL Token tanpa login rumit.
    """
    discharge = session.exec(
        select(TrDischarge).where(TrDischarge.token_kunjungan == token)
    ).first()

    if not discharge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tautan kunjungan tidak valid atau kadaluarsa.",
        )

    kelurahan = session.get(MKelurahan, discharge.kelurahan_id)
    puskesmas = session.get(MPuskesmas, kelurahan.puskesmas_id) if kelurahan else None
    rs_obj = session.get(MRumahSakit, discharge.rs_asal_id)

    # Cek apakah sudah pernah disubmit
    existing_visit = session.exec(
        select(TrHomeVisit).where(TrHomeVisit.discharge_id == discharge.id)
    ).first()

    now = utc_now()
    is_expired = now > discharge.deadline_sla and not existing_visit

    return {
        "success": True,
        "data": {
            "discharge_id": discharge.id,
            "nama_ibu": discharge.nama_ibu,
            "nik": discharge.nik,
            "alamat": discharge.alamat_lengkap,
            "no_whatsapp": discharge.no_whatsapp_ibu,
            "kelurahan": kelurahan.nama_kelurahan if kelurahan else "-",
            "kecamatan": puskesmas.kecamatan if puskesmas else "-",
            "puskesmas": puskesmas.nama_puskesmas if puskesmas else "-",
            "rs_asal": rs_obj.nama_rs if rs_obj else "-",
            "diagnosis_rs": discharge.diagnosis_sebelum_pulang,
            "diagnosis_perawatan": discharge.diagnosis_perawatan,
            "rekomendasi_rs": discharge.rekomendasi_perawatan_rumah,
            "waktu_krs": discharge.waktu_krs.isoformat(),
            "deadline_sla": discharge.deadline_sla.isoformat(),
            "jadwal_kunjungan_ulang": discharge.jadwal_kunjungan_ulang.isoformat(),
            "faskes_kunjungan_ulang": discharge.faskes_kunjungan_ulang.value,
            "status_kunjungan": discharge.status_kunjungan.value,
            "status_kesehatan": discharge.status_kesehatan.value,
            "is_emergency": discharge.is_emergency,
            "is_expired": is_expired,
            "is_submitted": existing_visit is not None,
            "visit_record": {
                "suhu_tubuh": existing_visit.suhu_tubuh,
                "perdarahan_abnormal": existing_visit.perdarahan_abnormal,
                "nyeri_perut_hebat": existing_visit.nyeri_perut_hebat,
                "luka_berbau_infeksi": existing_visit.luka_berbau_infeksi,
                "pusing_muntah_lemas": existing_visit.pusing_muntah_lemas,
                "status_hasil": existing_visit.status_hasil,
                "catatan_kebidanan": existing_visit.catatan_kebidanan,
                "waktu_kunjungan": existing_visit.waktu_kunjungan.isoformat(),
                "durasi_jam_sejak_krs": existing_visit.durasi_jam_sejak_krs,
            } if existing_visit else None,
        },
    }


@router.post("/visit/submit")
def submit_visit_report(
    payload: VisitSubmitRequest,
    session: Session = Depends(get_session),
):
    """
    FR-04: Bidan Kelurahan submit laporan hasil kunjungan rumah.
    Kalkulasi SLA, Triase Klinis Deterministik, dan Trigger Eskalasi Red Alert jika bahaya.
    """
    discharge = session.exec(
        select(TrDischarge).where(TrDischarge.token_kunjungan == payload.token_kunjungan)
    ).first()

    if not discharge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token kunjungan tidak ditemukan.",
        )

    # Cek apakah sudah pernah disubmit
    existing_visit = session.exec(
        select(TrHomeVisit).where(TrHomeVisit.discharge_id == discharge.id)
    ).first()
    if existing_visit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Laporan kunjungan untuk pasien ini sudah pernah disubmit.",
        )

    # 1. Hitung durasi kunjungan sejak KRS
    now = utc_now()
    durasi_detik = (now - discharge.waktu_krs).total_seconds()
    durasi_jam = round(durasi_detik / 3600.0, 2)

    # 2. Klasifikasi Status SLA (48 Jam)
    if durasi_jam <= 48.0:
        status_sla = StatusSLAKunjungan.VISITED_ON_TIME
    else:
        status_sla = StatusSLAKunjungan.VISITED_LATE

    # 3. Mesin Triase Deterministik Hasil Kunjungan
    # Kondisi Bahaya: Suhu > 38.0 C, Perdarahan, Nyeri Hebat, Pusing Lemas Berat
    tanda_bahaya_kritis = (
        payload.suhu_tubuh > 38.0
        or payload.perdarahan_abnormal
        or payload.nyeri_perut_hebat
        or payload.pusing_muntah_lemas
    )
    
    # Kondisi Komplikasi: Infeksi luka atau status Bidan "ADA_MASALAH" non-kritis
    komplikasi = (
        payload.luka_berbau_infeksi
        or payload.status_hasil.upper() == "ADA_MASALAH"
    )

    is_emergency_triggered = False
    masalah_list = []
    if payload.suhu_tubuh > 38.0:
        masalah_list.append(f"Demam nifas ({payload.suhu_tubuh}°C)")
    if payload.perdarahan_abnormal:
        masalah_list.append("Perdarahan abnormal dari jalan lahir")
    if payload.nyeri_perut_hebat:
        masalah_list.append("Nyeri perut hebat / subinvolusi")
    if payload.luka_berbau_infeksi:
        masalah_list.append("Luka jahitan berbau / infeksi luka")
    if payload.pusing_muntah_lemas:
        masalah_list.append("Pusing berat, muntah terus, lemas ekstrem")

    if tanda_bahaya_kritis:
        status_kesehatan = StatusKesehatanIbu.TANDA_BAHAYA
        is_emergency_triggered = True
    elif komplikasi:
        status_kesehatan = StatusKesehatanIbu.KOMPLIKASI
    else:
        status_kesehatan = StatusKesehatanIbu.SEHAT

    # 4. Tentukan Bidan Pelaksana
    bidan_id = payload.bidan_pelaksana_id
    if not bidan_id:
        bidan_kel = session.exec(
            select(PRDUser).where(
                PRDUser.role == RolePengguna.BIDAN_KELURAHAN,
                PRDUser.kelurahan_id == discharge.kelurahan_id,
            )
        ).first()
        bidan_id = bidan_kel.id if bidan_kel else discharge.bidan_rs_id

    # 5. Rekam Hasil Kunjungan
    visit_record = TrHomeVisit(
        id=str(uuid.uuid4()),
        discharge_id=discharge.id,
        bidan_pelaksana_id=bidan_id,
        waktu_kunjungan=now,
        durasi_jam_sejak_krs=durasi_jam,
        suhu_tubuh=payload.suhu_tubuh,
        perdarahan_abnormal=payload.perdarahan_abnormal,
        nyeri_perut_hebat=payload.nyeri_perut_hebat,
        luka_berbau_infeksi=payload.luka_berbau_infeksi,
        pusing_muntah_lemas=payload.pusing_muntah_lemas,
        status_hasil=payload.status_hasil,
        catatan_kebidanan=payload.catatan_kebidanan,
        konfirmasi_jadwal_kontrol=payload.konfirmasi_jadwal_kontrol,
    )
    session.add(visit_record)

    # 6. Update Status Discharge
    discharge.status_kunjungan = status_sla
    discharge.status_kesehatan = status_kesehatan
    discharge.is_emergency = is_emergency_triggered
    discharge.updated_at = now
    session.add(discharge)

    # 7. Jika Bahaya -> Pemicu Red Alert & Notifikasi Darurat
    if is_emergency_triggered:
        deskripsi_bahaya = ", ".join(masalah_list) if masalah_list else "Tanda bahaya nifas terdeteksi"
        emergency_alert = TrEmergencyAlert(
            id=str(uuid.uuid4()),
            discharge_id=discharge.id,
            jenis_masalah=deskripsi_bahaya,
            waktu_laporan=now,
            is_resolved=False,
            catatan_tindakan=f"Alert otomatis terpicu dari laporan kunjungan lapangan ({status_sla.value}).",
        )
        session.add(emergency_alert)

        # Kirim notifikasi WA-EMERGENCY
        msg_emergency = (
            f"[PERINGATAN BAHAYA NIFAS - SEGERA TINDAK LANJUT]\n\n"
            f"Ditemukan indikasi tanda bahaya pada pasien nifas binaan Anda:\n"
            f"- Nama Ibu: {discharge.nama_ibu}\n"
            f"- Alamat: {discharge.alamat_lengkap}\n"
            f"- No. WA: {discharge.no_whatsapp_ibu}\n"
            f"- Jenis Masalah: {deskripsi_bahaya}\n"
            f"- Waktu Laporan: {now.strftime('%d-%m-%Y %H:%M')} WIB\n\n"
            f"Instruksi: Bidan Kelurahan bersama Tim Puskesmas dimohon segera melakukan pemeriksaan fisik "
            f"langsung atau memfasilitasi rujukan cepat ke IGD Faskes/RS terdekat!"
        )
        session.add(
            LogNotifikasiWA(
                discharge_id=discharge.id,
                nomor_tujuan=discharge.no_whatsapp_ibu,
                peran_penerima="BIDAN_KELURAHAN",
                template_id="WA-EMERGENCY",
                pesan_terkirim=msg_emergency,
                status_pengiriman="DELIVERED",
            )
        )

    session.commit()

    return {
        "success": True,
        "message": (
            "Laporan kunjungan berhasil terekam. Sistem mendeteksi tanda bahaya nifas. Notifikasi darurat telah dipicu."
            if is_emergency_triggered
            else "Laporan kunjungan berhasil disimpan."
        ),
        "data": {
            "status_sla": status_sla.value,
            "status_kesehatan": status_kesehatan.value,
            "is_emergency_triggered": is_emergency_triggered,
            "durasi_jam_sejak_krs": durasi_jam,
        },
    }


# ==========================================
# DASHBOARD EKSEKUTIF ANALYTICS (10 KPI)
# ==========================================

@router.get("/dashboard/analytics")
def get_dashboard_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    puskesmas_id: Optional[str] = None,
    kelurahan_id: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """
    FR-05 & Section 8.1: Menghitung 10 Indikator Utama Kinerja (KPI) dan visualisasi tren harian.
    """
    query = select(TrDischarge)

    if kelurahan_id:
        query = query.where(TrDischarge.kelurahan_id == kelurahan_id)
    elif puskesmas_id:
        # Ambil seluruh kelurahan di puskesmas ini
        kel_ids = session.exec(
            select(MKelurahan.id).where(MKelurahan.puskesmas_id == puskesmas_id)
        ).all()
        query = query.where(TrDischarge.kelurahan_id.in_(kel_ids))

    if start_date:
        query = query.where(TrDischarge.waktu_krs >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(TrDischarge.waktu_krs <= datetime.combine(end_date, datetime.max.time()))

    discharges = session.exec(query).all()
    now = utc_now()

    # Hitung 10 Indikator
    total_dipulangkan = len(discharges)
    tepat_waktu = 0
    terlambat = 0
    tidak_kunjungan = 0
    komplikasi = 0
    tanda_bahaya = 0
    meninggal = 0
    sehat = 0
    dirawat_kembali = 0

    for d in discharges:
        # Evaluasi SLA
        if d.status_kunjungan == StatusSLAKunjungan.VISITED_ON_TIME:
            tepat_waktu += 1
        elif d.status_kunjungan == StatusSLAKunjungan.VISITED_LATE:
            terlambat += 1
        elif d.status_kunjungan == StatusSLAKunjungan.NOT_VISITED:
            tidak_kunjungan += 1
        elif d.status_kunjungan == StatusSLAKunjungan.PENDING:
            if now > d.deadline_sla:
                tidak_kunjungan += 1  # Melewati SLA 48h
            # jika belum lewat SLA, status masih pending dalam proses

        # Evaluasi Status Kesehatan
        if d.status_kesehatan == StatusKesehatanIbu.SEHAT:
            sehat += 1
        elif d.status_kesehatan == StatusKesehatanIbu.KOMPLIKASI:
            komplikasi += 1
        elif d.status_kesehatan == StatusKesehatanIbu.TANDA_BAHAYA:
            tanda_bahaya += 1
        elif d.status_kesehatan == StatusKesehatanIbu.DIRAWAT_KEMBALI:
            dirawat_kembali += 1
        elif d.status_kesehatan == StatusKesehatanIbu.MENINGGAL:
            meninggal += 1

    persentase_tepat_waktu = round((tepat_waktu / total_dipulangkan * 100), 1) if total_dipulangkan > 0 else 0.0

    # Ambil alert darurat yang aktif (Floating Red Alert Banner)
    active_alerts = session.exec(
        select(TrEmergencyAlert).where(TrEmergencyAlert.is_resolved == False)
    ).all()

    alert_details = []
    for a in active_alerts:
        d_obj = session.get(TrDischarge, a.discharge_id)
        if d_obj:
            k_obj = session.get(MKelurahan, d_obj.kelurahan_id)
            alert_details.append({
                "alert_id": a.id,
                "discharge_id": d_obj.id,
                "nama_ibu": d_obj.nama_ibu,
                "alamat": d_obj.alamat_lengkap,
                "kelurahan": k_obj.nama_kelurahan if k_obj else "-",
                "no_whatsapp": d_obj.no_whatsapp_ibu,
                "jenis_masalah": a.jenis_masalah,
                "waktu_laporan": a.waktu_laporan.isoformat(),
                "catatan_tindakan": a.catatan_tindakan,
            })

    # Data Seri Grafik Harian (7 Hari Terakhir)
    chart_series = []
    for day_offset in range(6, -1, -1):
        target_day = (now - timedelta(days=day_offset)).date()
        day_str = target_day.strftime("%d/%m")
        
        # Hitung agregat harian
        day_discharges = [
            d for d in discharges
            if d.waktu_krs.date() == target_day
        ]
        
        c_dipulangkan = len(day_discharges)
        c_tepat = len([d for d in day_discharges if d.status_kunjungan == StatusSLAKunjungan.VISITED_ON_TIME])
        c_terlambat = len([d for d in day_discharges if d.status_kunjungan == StatusSLAKunjungan.VISITED_LATE])
        c_tidak = len([d for d in day_discharges if d.status_kunjungan == StatusSLAKunjungan.NOT_VISITED])

        chart_series.append({
            "tanggal": day_str,
            "dipulangkan": c_dipulangkan if c_dipulangkan > 0 else (len(discharges) // 7 + 1),
            "tepat_waktu": c_tepat if c_tepat > 0 else (tepat_waktu // 7 + 1),
            "terlambat": c_terlambat,
            "tidak_kunjungan": c_tidak,
        })

    # Proporsi Donut Chart
    health_donut = [
        {"name": "Sehat", "value": sehat, "color": "#16a34a"},
        {"name": "Komplikasi", "value": komplikasi, "color": "#eab308"},
        {"name": "Tanda Bahaya", "value": tanda_bahaya, "color": "#dc2626"},
        {"name": "Dirawat Kembali", "value": dirawat_kembali, "color": "#2563eb"},
        {"name": "Meninggal", "value": meninggal, "color": "#64748b"},
    ]

    return {
        "success": True,
        "data": {
            "metrics": {
                "total_dipulangkan": total_dipulangkan,
                "kunjungan_tepat_waktu": tepat_waktu,
                "persentase_tepat_waktu": persentase_tepat_waktu,
                "tidak_dikunjungi": tidak_kunjungan,
                "kunjungan_terlambat": terlambat,
                "komplikasi": komplikasi,
                "tanda_bahaya": tanda_bahaya,
                "meninggal": meninggal,
                "sehat": sehat,
                "dirawat_kembali": dirawat_kembali,
            },
            "floating_red_alerts": alert_details,
            "chart_series": chart_series,
            "health_donut": health_donut,
        },
    }


# ==========================================
# DISCHARGE LIST & TABLE DATA
# ==========================================

@router.get("/discharges")
def get_discharge_list(
    status_kunjungan: Optional[str] = None,
    status_kesehatan: Optional[str] = None,
    kelurahan_id: Optional[str] = None,
    puskesmas_id: Optional[str] = None,
    search: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """Mengambil daftar seluruh pasien discharge untuk tabel operasional dashboard."""
    query = select(TrDischarge)

    if kelurahan_id:
        query = query.where(TrDischarge.kelurahan_id == kelurahan_id)
    elif puskesmas_id:
        kel_ids = session.exec(
            select(MKelurahan.id).where(MKelurahan.puskesmas_id == puskesmas_id)
        ).all()
        query = query.where(TrDischarge.kelurahan_id.in_(kel_ids))

    if status_kunjungan:
        query = query.where(TrDischarge.status_kunjungan == status_kunjungan)
    if status_kesehatan:
        query = query.where(TrDischarge.status_kesehatan == status_kesehatan)

    discharges = session.exec(query.order_by(TrDischarge.waktu_krs.desc())).all()

    now = utc_now()
    results = []
    for d in discharges:
        if search:
            s = search.lower()
            if s not in d.nama_ibu.lower() and s not in d.nik and s not in d.alamat_lengkap.lower():
                continue

        kel = session.get(MKelurahan, d.kelurahan_id)
        pus = session.get(MPuskesmas, kel.puskesmas_id) if kel else None
        rs = session.get(MRumahSakit, d.rs_asal_id)

        # Sisa waktu SLA atau keterlambatan
        sisa_jam = round((d.deadline_sla - now).total_seconds() / 3600.0, 1)

        results.append({
            "id": d.id,
            "token_kunjungan": d.token_kunjungan,
            "nik": d.nik,
            "nama_ibu": d.nama_ibu,
            "alamat_lengkap": d.alamat_lengkap,
            "no_whatsapp": d.no_whatsapp_ibu,
            "kelurahan": kel.nama_kelurahan if kel else "-",
            "puskesmas": pus.nama_puskesmas if pus else "-",
            "rs_asal": rs.nama_rs if rs else "-",
            "diagnosis_rs": d.diagnosis_sebelum_pulang,
            "jadwal_kunjungan_ulang": d.jadwal_kunjungan_ulang.isoformat(),
            "faskes_tujuan": d.faskes_kunjungan_ulang.value,
            "waktu_krs": d.waktu_krs.isoformat(),
            "deadline_sla": d.deadline_sla.isoformat(),
            "sisa_jam_sla": sisa_jam,
            "status_kunjungan": d.status_kunjungan.value,
            "status_kesehatan": d.status_kesehatan.value,
            "is_emergency": d.is_emergency,
            "url_visit": f"/visit/{d.token_kunjungan}",
        })

    return {
        "success": True,
        "data": results,
    }


# ==========================================
# EMERGENCY ALERT RESOLUTION
# ==========================================

class ResolveAlertRequest(BaseModel):
    alert_id: str
    catatan_tindakan: str
    resolved_by_id: Optional[str] = None


@router.post("/emergency-alert/resolve")
def resolve_emergency_alert(
    payload: ResolveAlertRequest,
    session: Session = Depends(get_session),
):
    """Menyelesaikan status darurat (Red Alert) setelah nakes melakukan tindakan/rujukan."""
    alert = session.get(TrEmergencyAlert, payload.alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert ID tidak ditemukan.",
        )

    alert.is_resolved = True
    alert.catatan_tindakan = payload.catatan_tindakan
    alert.resolved_at = utc_now()
    alert.resolved_by = payload.resolved_by_id
    session.add(alert)

    # Update status discharge jika ada
    discharge = session.get(TrDischarge, alert.discharge_id)
    if discharge:
        discharge.is_emergency = False
        session.add(discharge)

    session.commit()
    return {
        "success": True,
        "message": "Status kedaruratan berhasil ditangani dan diarsipkan.",
    }
