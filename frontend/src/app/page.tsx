'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchDashboardAnalytics,
  fetchDischarges,
  fetchMasterWilayah,
  resolveEmergencyAlert,
} from '@/lib/api';
import {
  DashboardAnalyticsData,
  DischargeListItem,
  MasterWilayahKecamatan,
  FloatingRedAlert,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  HeartPulse,
  Building2,
  RefreshCw,
  Search,
  ExternalLink,
  Phone,
  ShieldCheck,
  SendHorizontal,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExecutiveDashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalyticsData | null>(null);
  const [discharges, setDischarges] = useState<DischargeListItem[]>([]);
  const [wilayahList, setWilayahList] = useState<MasterWilayahKecamatan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [selectedPuskesmasId, setSelectedPuskesmasId] = useState<string>('ALL');
  const [selectedKelurahanId, setSelectedKelurahanId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Emergency Resolution Modal State
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState<FloatingRedAlert | null>(null);
  const [catatanTindakan, setCatatanTindakan] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Flatten Puskesmas & Kelurahan untuk dropdown
  const allPuskesmas = useMemo(() => {
    const list: { id: string; nama_puskesmas: string }[] = [];
    for (const k of wilayahList) {
      for (const p of k.puskesmas) {
        list.push({ id: p.id, nama_puskesmas: p.nama_puskesmas });
      }
    }
    return list;
  }, [wilayahList]);

  const allKelurahan = useMemo(() => {
    if (selectedPuskesmasId !== 'ALL') {
      for (const k of wilayahList) {
        for (const p of k.puskesmas) {
          if (p.id === selectedPuskesmasId) {
            return p.kelurahan;
          }
        }
      }
    }
    const list: { id: string; nama_kelurahan: string }[] = [];
    for (const k of wilayahList) {
      for (const p of k.puskesmas) {
        for (const kel of p.kelurahan) {
          list.push(kel);
        }
      }
    }
    return list;
  }, [wilayahList, selectedPuskesmasId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pId = selectedPuskesmasId === 'ALL' ? undefined : selectedPuskesmasId;
      const kId = selectedKelurahanId === 'ALL' ? undefined : selectedKelurahanId;

      const [anaRes, discRes, wilRes] = await Promise.all([
        fetchDashboardAnalytics({ puskesmas_id: pId, kelurahan_id: kId }),
        fetchDischarges({ puskesmas_id: pId, kelurahan_id: kId }),
        fetchMasterWilayah(),
      ]);

      setAnalytics(anaRes.data);
      setDischarges(discRes.data);
      setWilayahList(wilRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat analitik dashboard';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPuskesmasId, selectedKelurahanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Red Alert Resolution
  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertForResolve) return;
    if (!catatanTindakan.trim()) {
      toast.error('Wajib mengisi catatan tindakan / rujukan');
      return;
    }

    setIsResolving(true);
    try {
      await resolveEmergencyAlert(selectedAlertForResolve.alert_id, catatanTindakan);
      toast.success('Status kedaruratan berhasil diselesaikan & diarsipkan.');
      setSelectedAlertForResolve(null);
      setCatatanTindakan('');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyelesaikan alert';
      toast.error(msg);
    } finally {
      setIsResolving(false);
    }
  };

  // Filter Data Pasien Tabel
  const filteredDischarges = useMemo(() => {
    return discharges.filter((d) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ON_TIME' && d.status_kunjungan !== 'VISITED_ON_TIME') return false;
        if (statusFilter === 'LATE' && d.status_kunjungan !== 'VISITED_LATE') return false;
        if (statusFilter === 'NOT_VISITED' && d.status_kunjungan !== 'NOT_VISITED') return false;
        if (statusFilter === 'DANGER' && d.status_kesehatan !== 'TANDA_BAHAYA') return false;
        if (statusFilter === 'COMPLICATION' && d.status_kesehatan !== 'KOMPLIKASI') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.nama_ibu.toLowerCase().includes(q) ||
          d.nik.includes(q) ||
          d.alamat_lengkap.toLowerCase().includes(q) ||
          d.kelurahan.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [discharges, statusFilter, searchQuery]);

  const metrics = analytics?.metrics;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="size-6 text-teal-600" />
              Dashboard Eksekutif SIM-NIFAS Surabaya
            </h1>
            <Badge variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200">
              PRD 10 Indikator Utama
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Monitoring Kepatuhan SLA Kunjungan Rumah 48 Jam &amp; Deteksi Dini Kedaruratan Maternal Kota Surabaya.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </Button>

          <Link href="/register">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5">
              <span>+ Input KRS Pasien</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Red Alert Banner (Jika ada kasus bahaya aktif) */}
      {analytics && analytics.floating_red_alerts.length > 0 && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50/90 dark:bg-red-950/40 p-4 shadow-sm animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertOctagon className="size-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
                  <span>PERINGATAN DARURAT: {analytics.floating_red_alerts.length} KASUS TANDA BAHAYA BUTUH TINDAK LANJUT!</span>
                  <Badge className="bg-red-600 text-white text-[10px]">SLA &lt;15 Menit</Badge>
                </h3>
                <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                  Pasien terbaru: <strong>{analytics.floating_red_alerts[0].nama_ibu}</strong> ({analytics.floating_red_alerts[0].kelurahan}) — {analytics.floating_red_alerts[0].jenis_masalah}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setSelectedAlertForResolve(analytics.floating_red_alerts[0])}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold self-start sm:self-auto shrink-0"
            >
              Tindak Lanjut Kasus Ini
            </Button>
          </div>
        </div>
      )}

      {/* Filter Wilayah Interaktif */}
      <Card className="bg-muted/30">
        <CardContent className="p-3.5 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
            <Filter className="size-3.5 text-teal-600" />
            <span>Filter Wilayah:</span>
          </div>

          <div className="w-56">
            <Select value={selectedPuskesmasId} onValueChange={(val) => val && setSelectedPuskesmasId(val)}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Semua Puskesmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Puskesmas Surabaya</SelectItem>
                {allPuskesmas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama_puskesmas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-56">
            <Select value={selectedKelurahanId} onValueChange={(val) => val && setSelectedKelurahanId(val)}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Semua Kelurahan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kelurahan</SelectItem>
                {allKelurahan.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    Kelurahan {k.nama_kelurahan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedPuskesmasId !== 'ALL' || selectedKelurahanId !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedPuskesmasId('ALL');
                setSelectedKelurahanId('ALL');
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filter
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 10 KARTU INDIKATOR UTAMA (PRD Section 8.1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Kartu 1: Dipulangkan RS */}
        <Card className="border-l-4 border-l-blue-500 bg-background">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">1. Dipulangkan RS</span>
            <CardTitle className="text-xl font-bold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.total_dipulangkan || 0} ibu`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Total volume pasien KRS
          </CardContent>
        </Card>

        {/* Kartu 2: Kunjungan <= 2x24 Jam (HIJAU KEPATUHAN) */}
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              2. Kunjungan &le; 2x24 Jam
            </span>
            <CardTitle className="text-xl font-bold text-emerald-700 dark:text-emerald-300 flex items-baseline gap-1.5">
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <>
                  <span>{metrics?.kunjungan_tepat_waktu || 0}</span>
                  <span className="text-xs font-normal">({metrics?.persentase_tepat_waktu || 0}%)</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
            Kepatuhan SLA Tepat Waktu
          </CardContent>
        </Card>

        {/* Kartu 3: Tidak Dilakukan Kunjungan (MERAH SLA) */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/20">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-red-800 dark:text-red-300">
              3. Tidak Kunjungan
            </span>
            <CardTitle className="text-xl font-bold text-red-700 dark:text-red-300">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.tidak_dikunjungi || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-red-700/80 dark:text-red-300/80">
            Melewati ambang 48 jam
          </CardContent>
        </Card>

        {/* Kartu 4: Kunjungan > 2x24 Jam (KUNING SLA) */}
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              4. Kunjungan &gt; 2x24 Jam
            </span>
            <CardTitle className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.kunjungan_terlambat || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-amber-700/80 dark:text-amber-300/80">
            Dikunjungi namun terlambat
          </CardContent>
        </Card>

        {/* Kartu 5: Komplikasi Saat Kunjungan */}
        <Card className="border-l-4 border-l-yellow-500 bg-background">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">5. Komplikasi Kunjungan</span>
            <CardTitle className="text-xl font-bold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.komplikasi || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Luka jahitan / keluhan sedang
          </CardContent>
        </Card>

        {/* Kartu 6: Tanda Bahaya Nifas (RED ALERT) */}
        <Card className="border-l-4 border-l-rose-600 bg-rose-50/20 dark:bg-rose-950/20">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
              6. Tanda Bahaya Nifas
            </span>
            <CardTitle className="text-xl font-bold text-rose-700 dark:text-rose-300">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.tanda_bahaya || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-rose-700/80 dark:text-rose-300/80">
            Demam &gt;38°C / perdarahan deras
          </CardContent>
        </Card>

        {/* Kartu 7: Meninggal */}
        <Card className="border-l-4 border-l-slate-600 bg-background">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">7. Ibu Nifas Meninggal</span>
            <CardTitle className="text-xl font-bold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.meninggal || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Audit Kematian Maternal AMP
          </CardContent>
        </Card>

        {/* Kartu 8: Sehat */}
        <Card className="border-l-4 border-l-emerald-600 bg-background">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">8. Ibu Nifas Sehat</span>
            <CardTitle className="text-xl font-bold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.sehat || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Pemulihan fisik normal
          </CardContent>
        </Card>

        {/* Kartu 9: Dirawat Kembali */}
        <Card className="border-l-4 border-l-indigo-500 bg-background">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-muted-foreground">9. Dirawat Kembali</span>
            <CardTitle className="text-xl font-bold text-foreground">
              {isLoading ? <Skeleton className="h-7 w-12" /> : `${metrics?.dirawat_kembali || 0} orang`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-[11px] text-muted-foreground">
            Readmisi rawat inap ulang RS
          </CardContent>
        </Card>

        {/* Kartu 10: Pintasan Data Master */}
        <Card className="border-l-4 border-l-teal-600 bg-teal-50/30 dark:bg-teal-950/20 flex flex-col justify-between">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
              10. Data Lengkap Pasien
            </span>
            <CardTitle className="text-xl font-bold text-teal-700 dark:text-teal-300">
              {discharges.length} Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById('operational-table');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full text-[11px] h-7 bg-background text-teal-700 hover:bg-teal-50"
            >
              Lihat Tabel Operasional
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Visualisasi Grafik: Tren Garis Harian & Donut Status Kesehatan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Tren Garis Kunjungan Harian (Multi-line SVG) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Grafik Tren Kunjungan Harian (7 Hari Terakhir)
                </CardTitle>
                <CardDescription className="text-xs">
                  Fluktuasi pasien KRS, kunjungan tepat waktu (&le;48h), dan keterlambatan.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-blue-600 inline-block" />
                  KRS
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-600 inline-block" />
                  Tepat Waktu
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-500 inline-block" />
                  Terlambat
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading || !analytics ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <div className="space-y-3">
                {/* Visual Bar / Line Representation */}
                <div className="grid grid-cols-7 gap-2 h-40 items-end pt-4 border-b border-muted">
                  {analytics.chart_series.map((item, idx) => {
                    const maxVal = Math.max(
                      ...analytics.chart_series.map((s) => Math.max(s.dipulangkan, 1))
                    );
                    const hKrs = Math.max(15, Math.round((item.dipulangkan / maxVal) * 100));
                    const hTepat = Math.max(10, Math.round((item.tepat_waktu / maxVal) * 100));

                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end gap-1 text-[10px]">
                        <div className="flex items-end gap-1 w-full justify-center h-28">
                          {/* Bar KRS */}
                          <div
                            style={{ height: `${hKrs}%` }}
                            className="w-2.5 sm:w-3.5 bg-blue-500 rounded-t-sm hover:opacity-80 transition-all"
                            title={`Dipulangkan: ${item.dipulangkan}`}
                          />
                          {/* Bar Tepat Waktu */}
                          <div
                            style={{ height: `${hTepat}%` }}
                            className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm hover:opacity-80 transition-all"
                            title={`Tepat Waktu: ${item.tepat_waktu}`}
                          />
                        </div>
                        <span className="text-muted-foreground font-medium">{item.tanggal}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Rata-rata kepatuhan: <strong>{metrics?.persentase_tepat_waktu}%</strong></span>
                  <span>Target Dinkes Surabaya: <strong>&ge;95%</strong></span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grafik Proporsi Status Kesehatan Ibu Nifas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">
              Proporsi Status Kesehatan
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi hasil evaluasi triase nifas kota.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {isLoading || !analytics ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <div className="space-y-2.5">
                {analytics.health_donut.map((item, idx) => {
                  const total = metrics?.total_dipulangkan || 1;
                  const pct = Math.round((item.value / total) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span
                            className="size-2.5 rounded-full inline-block"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>
                        <span className="text-muted-foreground font-semibold">
                          {item.value} orang ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TABEL OPERASIONAL DISCHARGE & HASIL KUNJUNGAN */}
      <Card id="operational-table">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="size-4 text-teal-600" />
                Tabel Operasional Pemulangan &amp; Kunjungan Rumah
              </CardTitle>
              <CardDescription className="text-xs">
                Data real-time pasien KRS, batas waktu SLA 48 jam, status kesehatan, dan aksi langsung.
              </CardDescription>
            </div>

            {/* Search & Filter status */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama, NIK, alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8"
                />
              </div>

              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                <SelectTrigger className="h-8 text-xs w-36 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="ON_TIME">Tepat Waktu</SelectItem>
                  <SelectItem value="LATE">Terlambat</SelectItem>
                  <SelectItem value="NOT_VISITED">Belum Visit</SelectItem>
                  <SelectItem value="DANGER">Tanda Bahaya</SelectItem>
                  <SelectItem value="COMPLICATION">Komplikasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama Ibu &amp; NIK</TableHead>
                  <TableHead>Alamat &amp; Kelurahan</TableHead>
                  <TableHead>Kontak Pasien</TableHead>
                  <TableHead>Waktu KRS &amp; RS</TableHead>
                  <TableHead>Status Kunjungan (SLA)</TableHead>
                  <TableHead>Status Kesehatan</TableHead>
                  <TableHead className="text-right">Aksi Tindak Lanjut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredDischarges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pasien yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDischarges.map((d, idx) => (
                    <TableRow key={d.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <strong className="text-foreground block">{d.nama_ibu}</strong>
                        <span className="font-mono text-[11px] text-muted-foreground">{d.nik}</span>
                      </TableCell>
                      <TableCell>
                        <span className="block truncate max-w-[200px]" title={d.alamat_lengkap}>
                          {d.alamat_lengkap}
                        </span>
                        <span className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                          Kel. {d.kelurahan} ({d.puskesmas})
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://wa.me/${d.no_whatsapp.replace('+', '')}?text=${encodeURIComponent(
                            `Halo Ibu ${d.nama_ibu}, kami dari Puskesmas ${d.puskesmas} memantau pemulihan pasca KRS...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal-600 hover:underline font-mono"
                        >
                          <Phone className="size-3" />
                          <span>{d.no_whatsapp}</span>
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className="block text-[11px]">
                          {new Date(d.waktu_krs).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block max-w-[120px]">
                          {d.rs_asal}
                        </span>
                      </TableCell>
                      <TableCell>
                        {d.status_kunjungan === 'VISITED_ON_TIME' ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            &le; 2x24 Jam
                          </Badge>
                        ) : d.status_kunjungan === 'VISITED_LATE' ? (
                          <Badge className="bg-amber-600 text-white text-[10px]">
                            &gt; 2x24 Jam
                          </Badge>
                        ) : d.status_kunjungan === 'NOT_VISITED' ? (
                          <Badge className="bg-red-600 text-white text-[10px]">
                            Tidak Kunjungan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Pending ({d.sisa_jam_sla}h)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            d.status_kesehatan === 'TANDA_BAHAYA'
                              ? 'bg-rose-600 text-white text-[10px]'
                              : d.status_kesehatan === 'KOMPLIKASI'
                              ? 'bg-yellow-600 text-white text-[10px]'
                              : d.status_kesehatan === 'DIRAWAT_KEMBALI'
                              ? 'bg-blue-600 text-white text-[10px]'
                              : d.status_kesehatan === 'MENINGGAL'
                              ? 'bg-slate-700 text-white text-[10px]'
                              : 'bg-emerald-600 text-white text-[10px]'
                          }
                        >
                          {d.status_kesehatan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={d.url_visit}>
                          <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                            <span>Form Bidan</span>
                            <ChevronRight className="size-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tindak Lanjut Red Alert Kedaruratan */}
      <Dialog
        open={selectedAlertForResolve !== null}
        onOpenChange={(open) => !open && setSelectedAlertForResolve(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="size-6 text-red-600" />
              <DialogTitle>Tindak Lanjut Kedaruratan Nifas</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Dokumentasi tindakan medis dan koordinasi rujukan untuk kasus tanda bahaya.
            </DialogDescription>
          </DialogHeader>

          {selectedAlertForResolve && (
            <form onSubmit={handleResolveAlert} className="space-y-4 text-xs pt-2">
              <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-md border border-red-200 dark:border-red-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pasien:</span>
                  <strong className="text-foreground">{selectedAlertForResolve.nama_ibu}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kelurahan:</span>
                  <span className="text-foreground">{selectedAlertForResolve.kelurahan}</span>
                </div>
                <div className="pt-1 text-red-800 dark:text-red-300">
                  <span className="font-semibold block">Indikasi Masalah:</span>
                  {selectedAlertForResolve.jenis_masalah}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  Catatan Tindakan Medis / Koordinasi Ambulans Rujukan: <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  placeholder="Contoh: Bidan telah mendatangi rumah, pasang infus RL, berkoordinasi dengan ambulans 112 dan merujuk ke IGD RSUD Dr. Soetomo..."
                  value={catatanTindakan}
                  onChange={(e) => setCatatanTindakan(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAlertForResolve(null)}
                  disabled={isResolving}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isResolving}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  {isResolving ? 'Menyimpan...' : 'Selesaikan & Arsipkan Alert'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
