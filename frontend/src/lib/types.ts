// Legacy types for backwards-compatibility
export type FaskesKategori = 'RSUD' | 'PUSKESMAS';
export type UserRole = 'SUPER_ADMIN_DINKES' | 'ADMIN_FASKES' | 'BIDAN_JAGA';
export type DeliveryType = 'SPONTAN' | 'SC' | 'TINDAKAN';
export type ContactRelation = 'SUAMI' | 'ORANG_TUA' | 'KELUARGA_LAIN';
export type StatusPemantauan =
  | 'ONBOARDING_PENDING'
  | 'AKTIF'
  | 'LULUS'
  | 'DIRUJUK'
  | 'NONAKTIF'
  | 'MENINGGAL';
export type MilestoneKF = 'ONBOARDING' | 'KF1' | 'KF2' | 'KF3' | 'KF4';
export type TriageResult = 'HIJAU' | 'KUNING' | 'MERAH';
export type ActionType =
  | 'WA_ANAMNESIS'
  | 'TELEPON_SUAMI'
  | 'KUNJUNGAN_RUMAH'
  | 'KONTROL_FASKES'
  | 'RUJUK_RSUD';
export type CaseStatus = 'IN_PROGRESS' | 'RESOLVED' | 'REFERRED';

export interface Faskes {
  id: number;
  nama_faskes: string;
  kode_faskes: string;
  kategori: FaskesKategori;
  alamat?: string | null;
  no_telp_bidan_pj?: string | null;
  is_active: boolean;
}

export interface FaskesSummary {
  faskes_id: number;
  nama_faskes: string;
  kategori: FaskesKategori;
  total_ibu_aktif: number;
  triage_summary: {
    merah: number;
    kuning: number;
    hijau: number;
  };
}

export interface EmergencyContact {
  id?: number;
  mother_id?: string;
  nama_kontak: string;
  hubungan: ContactRelation;
  no_wa_darurat: string;
}

export interface Mother {
  id: string;
  faskes_id: number;
  nik: string;
  no_rm?: string | null;
  nama_ibu: string;
  no_wa_ibu: string;
  waktu_persalinan: string;
  metode_persalinan: DeliveryType;
  paritas?: string | null;
  status_pemantauan: StatusPemantauan;
  catatan_khusus?: string | null;
  created_at: string;
  emergency_contact?: EmergencyContact | null;
}

export interface MotherCreatePayload {
  faskes_id: number;
  nik: string;
  no_rm?: string;
  nama_ibu: string;
  no_wa_ibu: string;
  waktu_persalinan: string;
  metode_persalinan: DeliveryType;
  paritas?: string;
  catatan_khusus?: string;
  emergency_contact?: EmergencyContact;
}

export interface Intervention {
  id?: string;
  response_id?: string;
  screening_log_id?: string;
  mother_id: string;
  faskes_id?: number;
  nakes_id?: string | null;
  action_type?: ActionType;
  jenis_tindakan?: string;
  catatan_klinis?: string;
  catatan_tindakan?: string;
  status_kasus?: CaseStatus;
  triase_level?: string;
  created_at?: string;
}

export interface TriageQueueItem {
  log_id?: string;
  response_id?: string;
  mother_id: string;
  nama_ibu: string;
  nik: string;
  faskes_id: number;
  nama_faskes?: string;
  faskes_nama?: string;
  milestone: MilestoneKF;
  triage_result: TriageResult;
  jawaban_raw?: string;
  jawaban_pasien?: string;
  gejala?: string;
  waktu_respon?: string;
  responded_at?: string;
  no_wa_ibu: string;
  nama_suami?: string | null;
  no_wa_suami?: string | null;
  is_intervened: boolean;
  latest_intervention?: Intervention | null;
  wa_me_mother_url?: string;
  wa_me_husband_url?: string | null;
  wa_direct_link?: string;
  wa_emergency_link?: string | null;
}

// ==========================================
// PRD DOMAIN TYPES (SIM-NIFAS SURABAYA)
// ==========================================

export type RolePengguna =
  | 'SUPERADMIN_DINKES'
  | 'KEPALA_PUSKESMAS'
  | 'BIDAN_KELURAHAN'
  | 'BIDAN_RS';

export type StatusSLAKunjungan =
  | 'PENDING'
  | 'VISITED_ON_TIME'
  | 'VISITED_LATE'
  | 'NOT_VISITED';

export type StatusKesehatanIbu =
  | 'SEHAT'
  | 'KOMPLIKASI'
  | 'TANDA_BAHAYA'
  | 'DIRAWAT_KEMBALI'
  | 'MENINGGAL';

export type TipeFaskesRujukan = 'RS' | 'PUSKESMAS';

export interface MasterWilayahPuskesmas {
  id: string;
  nama_puskesmas: string;
  no_telp?: string | null;
  kelurahan: { id: string; nama_kelurahan: string }[];
}

export interface MasterWilayahKecamatan {
  kecamatan: string;
  puskesmas: MasterWilayahPuskesmas[];
}

export interface RawKelurahan {
  id: string;
  nama_kelurahan: string;
  puskesmas_id: string;
}

export interface MasterRumahSakit {
  id: string;
  nama_rs: string;
  tipe_rs: string;
  alamat_rs?: string | null;
}

export interface DischargeCreatePayload {
  nik: string;
  nama_ibu: string;
  alamat_lengkap: string;
  kelurahan_id: string;
  no_whatsapp_ibu: string;
  diagnosis_sebelum_pulang: string;
  diagnosis_perawatan: string;
  rekomendasi_perawatan_rumah: string;
  jadwal_kunjungan_ulang: string;
  faskes_kunjungan_ulang: TipeFaskesRujukan;
  rs_asal_id?: string;
  bidan_rs_id?: string;
}

export interface DischargeListItem {
  id: string;
  token_kunjungan: string;
  nik: string;
  nama_ibu: string;
  alamat_lengkap: string;
  no_whatsapp: string;
  kelurahan: string;
  puskesmas: string;
  rs_asal: string;
  diagnosis_rs: string;
  jadwal_kunjungan_ulang: string;
  faskes_tujuan: string;
  waktu_krs: string;
  deadline_sla: string;
  sisa_jam_sla: number;
  status_kunjungan: StatusSLAKunjungan;
  status_kesehatan: StatusKesehatanIbu;
  is_emergency: boolean;
  url_visit: string;
}

export interface VisitDetailResponse {
  discharge_id: string;
  nama_ibu: string;
  nik: string;
  alamat: string;
  no_whatsapp: string;
  kelurahan: string;
  kecamatan: string;
  puskesmas: string;
  rs_asal: string;
  diagnosis_rs: string;
  diagnosis_perawatan: string;
  rekomendasi_rs: string;
  waktu_krs: string;
  deadline_sla: string;
  jadwal_kunjungan_ulang: string;
  faskes_kunjungan_ulang: string;
  status_kunjungan: StatusSLAKunjungan;
  status_kesehatan: StatusKesehatanIbu;
  is_emergency: boolean;
  is_expired: boolean;
  is_submitted: boolean;
  visit_record?: {
    suhu_tubuh: number;
    perdarahan_abnormal: boolean;
    nyeri_perut_hebat: boolean;
    luka_berbau_infeksi: boolean;
    pusing_muntah_lemas: boolean;
    status_hasil: string;
    catatan_kebidanan?: string | null;
    waktu_kunjungan: string;
    durasi_jam_sejak_krs: number;
  } | null;
}

export interface VisitSubmitPayload {
  token_kunjungan: string;
  suhu_tubuh: number;
  perdarahan_abnormal: boolean;
  nyeri_perut_hebat: boolean;
  luka_berbau_infeksi: boolean;
  pusing_muntah_lemas: boolean;
  status_hasil: string;
  catatan_kebidanan?: string;
  konfirmasi_jadwal_kontrol: string;
  bidan_pelaksana_id?: string;
}

export interface DashboardKPIMetrics {
  total_dipulangkan: number;
  kunjungan_tepat_waktu: number;
  persentase_tepat_waktu: number;
  tidak_dikunjungi: number;
  kunjungan_terlambat: number;
  komplikasi: number;
  tanda_bahaya: number;
  meninggal: number;
  sehat: number;
  dirawat_kembali: number;
}

export interface FloatingRedAlert {
  alert_id: string;
  discharge_id: string;
  nama_ibu: string;
  alamat: string;
  kelurahan: string;
  no_whatsapp: string;
  jenis_masalah: string;
  waktu_laporan: string;
  catatan_tindakan?: string;
}

export interface ChartSeriesItem {
  tanggal: string;
  dipulangkan: number;
  tepat_waktu: number;
  terlambat: number;
  tidak_kunjungan: number;
}

export interface HealthDonutItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardAnalyticsData {
  metrics: DashboardKPIMetrics;
  floating_red_alerts: FloatingRedAlert[];
  chart_series: ChartSeriesItem[];
  health_donut: HealthDonutItem[];
}
