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
  no_rm?: string | null;
  nama_ibu: string;
  no_wa_ibu: string;
  waktu_persalinan: string;
  metode_persalinan: DeliveryType;
  paritas?: string | null;
  catatan_khusus?: string | null;
  nama_suami: string;
  no_wa_suami: string;
  hubungan: ContactRelation;
}

export interface Intervention {
  id?: number;
  mother_id: string;
  screening_log_id?: number | null;
  bidan_user_id?: string | null;
  triase_level: TriageResult;
  jenis_tindakan: ActionType;
  catatan_klinis: string;
  status_kasus: CaseStatus;
  created_at?: string;
}

export interface TriageQueueItem {
  log_id: number;
  mother_id: string;
  nama_ibu: string;
  faskes_id: number;
  nama_faskes: string;
  milestone: MilestoneKF;
  triage_result: TriageResult;
  gejala?: string | null;
  jawaban_pasien?: string | null;
  responded_at?: string | null;
  wa_me_mother_url: string;
  wa_me_husband_url?: string | null;
  nama_suami?: string | null;
  no_wa_suami?: string | null;
  is_intervened: boolean;
  latest_intervention?: Intervention | null;
}
