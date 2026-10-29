'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchVisitByToken, submitVisitReport } from '@/lib/api';
import { VisitDetailResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HeartPulse,
  Clock,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  Building,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  PhoneCall,
} from 'lucide-react';
import { toast } from 'sonner';

function VisitTokenContent() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : '';

  const [data, setData] = useState<VisitDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [suhuTubuh, setSuhuTubuh] = useState<string>('36.7');
  const [perdarahanAbnormal, setPerdarahanAbnormal] = useState(false);
  const [nyeriPerutHebat, setNyeriPerutHebat] = useState(false);
  const [lukaBerbauInfeksi, setLukaBerbauInfeksi] = useState(false);
  const [pusingMuntahLemas, setPusingMuntahLemas] = useState(false);
  const [statusHasil, setStatusHasil] = useState<'BAIK' | 'ADA_MASALAH'>('BAIK');
  const [catatanKebidanan, setCatatanKebidanan] = useState('');
  const [konfirmasiJadwalKontrol, setKonfirmasiJadwalKontrol] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    status_sla: string;
    status_kesehatan: string;
    is_emergency_triggered: boolean;
    durasi_jam_sejak_krs: number;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchVisitByToken(token);
        setData(res.data);
        if (res.data.jadwal_kunjungan_ulang) {
          setKonfirmasiJadwalKontrol(res.data.jadwal_kunjungan_ulang);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat formulir kunjungan';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [token]);

  // Kalkulasi Waktu Berjalan sejak KRS
  const [timeInfo, setTimeInfo] = useState<{
    hoursElapsed: string;
    isLate: boolean;
    deadlineStr: string;
    krsStr: string;
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    const now = new Date();
    const krs = new Date(data.waktu_krs);
    const deadline = new Date(data.deadline_sla);
    const diffHours = (now.getTime() - krs.getTime()) / (1000 * 60 * 60);
    const isLate = diffHours > 48;
    setTimeInfo({
      hoursElapsed: diffHours.toFixed(1),
      isLate,
      deadlineStr: deadline.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      krsStr: krs.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  }, [data]);

  // Evaluasi Bahaya Real-time saat mengetik/mencentang
  const currentRisk = useMemo(() => {
    const suhuNum = parseFloat(suhuTubuh) || 36.5;
    const isDanger =
      suhuNum > 38.0 ||
      perdarahanAbnormal ||
      nyeriPerutHebat ||
      pusingMuntahLemas;

    const isComplication = lukaBerbauInfeksi || statusHasil === 'ADA_MASALAH';

    if (isDanger) return { level: 'MERAH', label: 'Tanda Bahaya Kritis (Red Alert)' };
    if (isComplication) return { level: 'KUNING', label: 'Perlu Perhatian Khusus (Komplikasi)' };
    return { level: 'HIJAU', label: 'Kondisi Normal / Sehat' };
  }, [suhuTubuh, perdarahanAbnormal, nyeriPerutHebat, lukaBerbauInfeksi, pusingMuntahLemas, statusHasil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const suhuNum = parseFloat(suhuTubuh);
    if (isNaN(suhuNum) || suhuNum < 34.0 || suhuNum > 43.0) {
      toast.error('Masukkan nilai suhu tubuh yang valid (34.0 - 43.0 °C)');
      return;
    }
    if (!konfirmasiJadwalKontrol) {
      toast.error('Tentukan konfirmasi tanggal jadwal kontrol ulang');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitVisitReport({
        token_kunjungan: token,
        suhu_tubuh: suhuNum,
        perdarahan_abnormal: perdarahanAbnormal,
        nyeri_perut_hebat: nyeriPerutHebat,
        luka_berbau_infeksi: lukaBerbauInfeksi,
        pusing_muntah_lemas: pusingMuntahLemas,
        status_hasil: statusHasil,
        catatan_kebidanan: catatanKebidanan.trim(),
        konfirmasi_jadwal_kontrol: konfirmasiJadwalKontrol,
      });

      toast.success(res.message);
      setSubmissionResult(res.data);
      // Reload detail
      const refreshed = await fetchVisitByToken(token);
      setData(refreshed.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan laporan kunjungan';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="size-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Tautan Tidak Dapat Dibuka</h2>
        <p className="text-xs text-muted-foreground">{errorMsg || 'Tautan kunjungan tidak valid.'}</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Bar Nav */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          <span>Ke Dashboard Utama</span>
        </Link>
        <Badge variant="outline" className="text-xs font-mono">
          Token: {token.slice(0, 8)}...
        </Badge>
      </div>

      {/* Header Pasien & Waktu KRS */}
      <Card className="border-teal-200 dark:border-teal-900 bg-teal-50/20 dark:bg-teal-950/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-foreground">
                  {data.nama_ibu}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  NIK: {data.nik}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="size-3 text-teal-600" />
                {data.alamat}, Kel. {data.kelurahan}, Kec. {data.kecamatan}
              </p>
            </div>

            {/* SLA Badge */}
            {timeInfo && (
              <div className="self-start sm:self-auto text-right">
                {timeInfo.isLate ? (
                  <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                    SLA Terlambat ({timeInfo.hoursElapsed} Jam)
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    SLA Tepat Waktu ({timeInfo.hoursElapsed} Jam)
                  </Badge>
                )}
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  Batas Maks: {timeInfo.deadlineStr}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs border-t pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
            <div>
              <span>RS Pemulih: </span>
              <strong className="text-foreground">{data.rs_asal}</strong>
            </div>
            <div>
              <span>Puskesmas Pembina: </span>
              <strong className="text-foreground">{data.puskesmas}</strong>
            </div>
            <div>
              <span>Diagnosis RS: </span>
              <span className="text-foreground">{data.diagnosis_rs}</span>
            </div>
            <div>
              <span>Jadwal Kontrol: </span>
              <strong className="text-foreground">{data.jadwal_kunjungan_ulang}</strong> ({data.faskes_kunjungan_ulang})
            </div>
          </div>
          <div className="rounded-md bg-background p-2.5 border text-xs">
            <span className="text-muted-foreground block text-[11px] font-semibold">Anjuran Perawatan RS:</span>
            <p className="text-foreground italic">{data.rekomendasi_rs}</p>
          </div>
        </CardContent>
      </Card>

      {/* Jika Sudah Disubmit: Tampilkan Hasil Rekam Kunjungan (Read Only) */}
      {data.is_submitted && data.visit_record && (
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Laporan Kunjungan Rumah Telah Selesai
              </CardTitle>
              <Badge
                className={
                  data.status_kesehatan === 'TANDA_BAHAYA'
                    ? 'bg-red-600 text-white'
                    : data.status_kesehatan === 'KOMPLIKASI'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }
              >
                {data.status_kesehatan}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Laporan telah terekam pada {new Date(data.visit_record.waktu_kunjungan).toLocaleString('id-ID')} WIB
              ({data.visit_record.durasi_jam_sejak_krs} jam sejak KRS).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background p-3 rounded-md border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Suhu Tubuh</span>
                <strong className="text-base text-foreground font-semibold">
                  {data.visit_record.suhu_tubuh} °C
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Perdarahan</span>
                <span className="font-semibold text-foreground">
                  {data.visit_record.perdarahan_abnormal ? '🔴 Abnormal' : '✓ Normal'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Infeksi Luka</span>
                <span className="font-semibold text-foreground">
                  {data.visit_record.luka_berbau_infeksi ? '🟡 Berbau/Nanah' : '✓ Bersih'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Status Evaluasi</span>
                <span className="font-semibold text-foreground">
                  {data.visit_record.status_hasil}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-semibold block text-[11px]">Catatan Asuhan Kebidanan:</span>
              <p className="text-foreground bg-background p-2.5 rounded-md border text-xs">
                {data.visit_record.catatan_kebidanan || 'Tidak ada catatan naratif.'}
              </p>
            </div>

            {data.is_emergency && (
              <div className="rounded-md bg-red-100 dark:bg-red-950/60 p-3 text-xs text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800 flex items-start gap-2">
                <AlertOctagon className="size-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Peringatan Red Alert Aktif:</strong> Kasus ini telah dievaluasi sebagai tanda bahaya maternal. Bidan Kelurahan bersama Puskesmas diinstruksikan segera mengawal rujukan ke faskes darurat.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Jika Belum Disubmit: Form Pengisian Kunjungan Rumah Bidan Kelurahan */}
      {!data.is_submitted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="size-4 text-teal-600" />
                Formulir Pemeriksaan Fisik &amp; Triase Bahaya Nifas
              </CardTitle>
              <CardDescription className="text-xs">
                Diisi oleh Bidan Kelurahan saat mendatangi rumah pasien nifas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Suhu Tubuh */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="size-4 text-teal-600" />
                    Suhu Tubuh Pasien (°C) <span className="text-red-500">*</span>
                  </span>
                  {parseFloat(suhuTubuh) > 38.0 && (
                    <Badge variant="destructive" className="text-[10px] py-0">
                      Demam Nifas (&gt;38°C)
                    </Badge>
                  )}
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="34"
                  max="43"
                  value={suhuTubuh}
                  onChange={(e) => setSuhuTubuh(e.target.value)}
                  className="max-w-xs font-mono font-semibold"
                  required
                />
                <span className="text-[11px] text-muted-foreground block">
                  Standar normal nifas: 36.5°C – 37.5°C. Suhu &gt; 38.0°C memicu Red Alert sepsis/infeksi.
                </span>
              </div>

              {/* Checklist 4 Tanda Bahaya */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground block">
                  Checklist 4 Tanda Bahaya Nifas (Pilih jika ada gejala):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={perdarahanAbnormal}
                      onChange={(e) => setPerdarahanAbnormal(e.target.checked)}
                      className="size-4 rounded text-teal-600"
                    />
                    <span>Perdarahan banyak / lokia berdarah merah segar deras</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nyeriPerutHebat}
                      onChange={(e) => setNyeriPerutHebat(e.target.checked)}
                      className="size-4 rounded text-teal-600"
                    />
                    <span>Nyeri perut hebat / uterus lembek / subinvolusi</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lukaBerbauInfeksi}
                      onChange={(e) => setLukaBerbauInfeksi(e.target.checked)}
                      className="size-4 rounded text-teal-600"
                    />
                    <span>Luka jahitan perineum/SC berbau busuk / nanah</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pusingMuntahLemas}
                      onChange={(e) => setPusingMuntahLemas(e.target.checked)}
                      className="size-4 rounded text-teal-600"
                    />
                    <span>Pusing berat, pandangan kabur, muntah terus, lemas</span>
                  </label>
                </div>
              </div>

              {/* Status Keseluruhan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Penilaian Hasil Kunjungan Bidan:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="statusHasil"
                      value="BAIK"
                      checked={statusHasil === 'BAIK'}
                      onChange={() => setStatusHasil('BAIK')}
                      className="size-4 text-teal-600"
                    />
                    <span className="font-medium text-foreground">Kondisi Baik / Pemulihan Normal</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="statusHasil"
                      value="ADA_MASALAH"
                      checked={statusHasil === 'ADA_MASALAH'}
                      onChange={() => setStatusHasil('ADA_MASALAH')}
                      className="size-4 text-amber-600"
                    />
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      Ada Masalah / Keluhan
                    </span>
                  </label>
                </div>
              </div>

              {/* Konfirmasi Jadwal Kontrol */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Konfirmasi Tanggal Jadwal Kontrol Ulang ke Faskes
                </label>
                <Input
                  type="date"
                  value={konfirmasiJadwalKontrol}
                  onChange={(e) => setKonfirmasiJadwalKontrol(e.target.value)}
                  className="max-w-xs"
                  required
                />
              </div>

              {/* Catatan Asuhan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Catatan Naratif Asuhan Kebidanan Lapangan
                </label>
                <Textarea
                  rows={3}
                  placeholder="Catatan TTV (tensi, nadi), involusi uteri, kondisi luka perineum/SC, laktasi, dan tindakan yang diberikan..."
                  value={catatanKebidanan}
                  onChange={(e) => setCatatanKebidanan(e.target.value)}
                />
              </div>

              {/* Real-time Triage Indicator Banner */}
              <div
                className={`p-3 rounded-md border text-xs flex items-center justify-between ${
                  currentRisk.level === 'MERAH'
                    ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                    : currentRisk.level === 'KUNING'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {currentRisk.level === 'MERAH' ? (
                    <AlertOctagon className="size-4 text-red-600 shrink-0" />
                  ) : currentRisk.level === 'KUNING' ? (
                    <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    Triase Otomatis: <strong>{currentRisk.label}</strong>
                  </span>
                </div>
                <Badge
                  className={
                    currentRisk.level === 'MERAH'
                      ? 'bg-red-600 text-white'
                      : currentRisk.level === 'KUNING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }
                >
                  {currentRisk.level}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-6"
              >
                {isSubmitting ? 'Menyimpan Laporan...' : 'Simpan Laporan Kunjungan'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}

export default function VisitTokenPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-12 text-center text-xs text-muted-foreground">
          Memuat formulir...
        </div>
      }
    >
      <VisitTokenContent />
    </React.Suspense>
  );
}
