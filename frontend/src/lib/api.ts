import {
  EmergencyContact,
  Faskes,
  FaskesSummary,
  Intervention,
  Mother,
  MotherCreatePayload,
  TriageQueueItem,
  TriageResult,
  UserRole,
  MasterWilayahKecamatan,
  RawKelurahan,
  MasterRumahSakit,
  DischargeCreatePayload,
  DischargeListItem,
  VisitDetailResponse,
  VisitSubmitPayload,
  DashboardAnalyticsData,
} from './types';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getFullUrl(path: string): URL {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    return new URL(`${API_BASE_URL}${path}`);
  }
  return new URL(`${API_BASE_URL}${path}`, base);
}
export interface RequestOptions {
  faskesId?: number | null;
  userRole?: UserRole | null;
}

function buildHeaders(options?: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.faskesId !== undefined && options?.faskesId !== null) {
    headers['X-Faskes-Id'] = String(options.faskesId);
  }
  if (options?.userRole) {
    headers['X-User-Role'] = options.userRole;
  }
  return headers;
}

export async function fetchFaskesList(): Promise<Faskes[]> {
  const res = await fetch(`${API_BASE_URL}/faskes`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Gagal mengambil daftar Faskes');
  return res.json();
}

export async function fetchFaskesSummary(faskesId: number): Promise<FaskesSummary> {
  const res = await fetch(`${API_BASE_URL}/faskes/${faskesId}/summary`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Gagal mengambil ringkasan Faskes');
  return res.json();
}

export async function fetchTriageQueue(
  triageResult?: TriageResult | null,
  options?: RequestOptions
): Promise<TriageQueueItem[]> {
  const url = getFullUrl('/triage/queue');
  if (triageResult) {
    url.searchParams.set('triage_result', triageResult);
  }
  const res = await fetch(url.toString(), {
    headers: buildHeaders(options),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Gagal memuat antrean triase');
  return res.json();
}

export async function recordIntervention(
  payload: Intervention,
  options?: RequestOptions
): Promise<Intervention> {
  const res = await fetch(`${API_BASE_URL}/triage/interventions`, {
    method: 'POST',
    headers: buildHeaders(options),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal mencatat intervensi');
  return res.json();
}

export async function registerMother(
  payload: MotherCreatePayload,
  options?: RequestOptions
): Promise<Mother> {
  const res = await fetch(`${API_BASE_URL}/mothers`, {
    method: 'POST',
    headers: buildHeaders(options),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Gagal mendaftarkan ibu nifas');
  }
  return res.json();
}

export async function fetchMothers(options?: RequestOptions): Promise<Mother[]> {
  const res = await fetch(`${API_BASE_URL}/mothers`, {
    headers: buildHeaders(options),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Gagal memuat daftar pasien ibu nifas');
  return res.json();
}

export interface MotherDetailResponse {
  mother: Mother;
  emergency_contact: EmergencyContact | null;
  schedules: Array<{
    id: number;
    milestone: string;
    scheduled_date: string;
    status: string;
  }>;
  triage_logs: Array<{
    id: number;
    milestone: string;
    triage_result: TriageResult;
    raw_message_text: string;
    gejala_terdeteksi?: string | null;
    responded_at?: string | null;
  }>;
}

export async function fetchMotherDetail(
  motherId: string,
  options?: RequestOptions
): Promise<MotherDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/mothers/${motherId}`, {
    headers: buildHeaders(options),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Gagal memuat detail pasien');
  return res.json();
}

export async function updateMotherStatus(
  motherId: string,
  status: string,
  options?: RequestOptions
): Promise<{ status: string; mother_id: string; new_status: string }> {
  const url = getFullUrl(`/mothers/${motherId}/status`);
  url.searchParams.set('status_pemantauan', status);
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: buildHeaders(options),
  });
  if (!res.ok) throw new Error('Gagal memperbarui status pasien');
  return res.json();
}

export async function simulateWebhookResponse(
  fromPhone: string,
  messageText: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE_URL}/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromPhone,
      text: messageText,
    }),
  });
  if (!res.ok) throw new Error('Gagal mengirim simulasi balasan WhatsApp');
  return res.json();
}

// ==========================================
// PRD SIM-NIFAS API METHODS
// ==========================================

export async function fetchMasterWilayah(): Promise<{
  success: boolean;
  data: MasterWilayahKecamatan[];
  raw_kelurahan: RawKelurahan[];
}> {
  const res = await fetch(`${API_BASE_URL}/master/wilayah`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memuat master wilayah Surabaya');
  return res.json();
}

export async function fetchMasterRumahSakit(): Promise<{
  success: boolean;
  data: MasterRumahSakit[];
}> {
  const res = await fetch(`${API_BASE_URL}/master/rumah-sakit`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memuat master Rumah Sakit');
  return res.json();
}

export async function createDischarge(
  payload: DischargeCreatePayload
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`${API_BASE_URL}/discharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menyimpan data pemulangan (KRS)');
  }
  return res.json();
}

export async function fetchVisitByToken(
  token: string
): Promise<{ success: boolean; data: VisitDetailResponse }> {
  const res = await fetch(`${API_BASE_URL}/visit/${token}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Tautan kunjungan tidak ditemukan atau kadaluarsa');
  }
  return res.json();
}

export async function submitVisitReport(
  payload: VisitSubmitPayload
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`${API_BASE_URL}/visit/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menyimpan laporan kunjungan rumah');
  }
  return res.json();
}

export async function fetchDashboardAnalytics(params?: {
  start_date?: string;
  end_date?: string;
  puskesmas_id?: string;
  kelurahan_id?: string;
}): Promise<{ success: boolean; data: DashboardAnalyticsData }> {
  const url = getFullUrl('/dashboard/analytics');
  if (params?.start_date) url.searchParams.set('start_date', params.start_date);
  if (params?.end_date) url.searchParams.set('end_date', params.end_date);
  if (params?.puskesmas_id) url.searchParams.set('puskesmas_id', params.puskesmas_id);
  if (params?.kelurahan_id) url.searchParams.set('kelurahan_id', params.kelurahan_id);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memuat analitik dashboard');
  return res.json();
}

export async function fetchDischarges(params?: {
  status_kunjungan?: string;
  status_kesehatan?: string;
  kelurahan_id?: string;
  puskesmas_id?: string;
  search?: string;
}): Promise<{ success: boolean; data: DischargeListItem[] }> {
  const url = getFullUrl('/discharges');
  if (params?.status_kunjungan) url.searchParams.set('status_kunjungan', params.status_kunjungan);
  if (params?.status_kesehatan) url.searchParams.set('status_kesehatan', params.status_kesehatan);
  if (params?.kelurahan_id) url.searchParams.set('kelurahan_id', params.kelurahan_id);
  if (params?.puskesmas_id) url.searchParams.set('puskesmas_id', params.puskesmas_id);
  if (params?.search) url.searchParams.set('search', params.search);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal memuat daftar pasien pemulangan');
  return res.json();
}

export async function resolveEmergencyAlert(
  alertId: string,
  catatanTindakan: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/emergency-alert/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_id: alertId,
      catatan_tindakan: catatanTindakan,
    }),
  });
  if (!res.ok) throw new Error('Gagal menyelesaikan alert kedaruratan');
  return res.json();
}
