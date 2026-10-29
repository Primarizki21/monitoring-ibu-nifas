'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { fetchFaskesList, fetchFaskesSummary, fetchMothers } from '@/lib/api';
import { Faskes, FaskesSummary, Mother } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Download,
  Building2,
  Users,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface FaskesRowData extends Faskes {
  summary?: FaskesSummary['triage_summary'];
  total_aktif?: number;
}

export default function DinkesPage() {
  const router = useRouter();
  const { setSelectedFaskesId } = useTenant();
  const [faskesData, setFaskesData] = useState<FaskesRowData[]>([]);
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<'ALL' | 'RSUD' | 'PUSKESMAS'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDinkesData();
  }, []);

  const loadDinkesData = async () => {
    setIsLoading(true);
    try {
      const [list, mothersList] = await Promise.all([
        fetchFaskesList(),
        fetchMothers().catch(() => []),
      ]);
      setMothers(mothersList);

      // Ambil summary untuk setiap faskes
      const rows = await Promise.all(
        list.map(async (f) => {
          try {
            const sum = await fetchFaskesSummary(f.id);
            return {
              ...f,
              summary: sum.triage_summary,
              total_aktif: sum.total_ibu_aktif,
            };
          } catch {
            return {
              ...f,
              summary: { merah: 0, kuning: 0, hijau: 0 },
              total_aktif: 0,
            };
          }
        })
      );
      setFaskesData(rows);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data agregat Dinkes';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Kalkulasi KPI Kota Surabaya
  const cityKpis = useMemo(() => {
    const totalAktif = faskesData.reduce((acc, curr) => acc + (curr.total_aktif || 0), 0);
    const totalMerah = faskesData.reduce((acc, curr) => acc + (curr.summary?.merah || 0), 0);
    const totalKuning = faskesData.reduce((acc, curr) => acc + (curr.summary?.kuning || 0), 0);
    const totalHijau = faskesData.reduce((acc, curr) => acc + (curr.summary?.hijau || 0), 0);
    const totalSkrining = totalMerah + totalKuning + totalHijau;

    return {
      totalFaskes: faskesData.length,
      totalAktif: totalAktif || mothers.length,
      totalMerah,
      totalKuning,
      totalHijau,
      totalSkrining,
      targetPilot: 1500, // Sesuai AGENTS.md (3 bulan pilot)
    };
  }, [faskesData, mothers]);

  // Filter tabel
  const filteredFaskes = useMemo(() => {
    return faskesData.filter((f) => {
      const matchesSearch =
        f.nama_faskes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.kode_faskes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = kategoriFilter === 'ALL' || f.kategori === kategoriFilter;
      return matchesSearch && matchesCat;
    });
  }, [faskesData, searchQuery, kategoriFilter]);

  // Ekspor CSV
  const handleExportCsv = () => {
    if (faskesData.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = [
      'ID Faskes',
      'Kode Faskes',
      'Nama Fasilitas Kesehatan',
      'Kategori',
      'Ibu Nifas Terpantau',
      'Kasus Merah (Kritis)',
      'Kasus Kuning (Waspada)',
      'Kasus Hijau (Stabil)',
      'Kontak Bidan PJ',
    ];

    const rows = faskesData.map((f) => [
      f.id,
      f.kode_faskes,
      `"${f.nama_faskes}"`,
      f.kategori,
      f.total_aktif || 0,
      f.summary?.merah || 0,
      f.summary?.kuning || 0,
      f.summary?.hijau || 0,
      f.no_telp_bidan_pj || '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Pemantauan_Nifas_Surabaya_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Berkas CSV berhasil diunduh', {
      description: 'Laporan agregat 13 Faskes siap digunakan untuk evaluasi Dinkes.',
    });
  };

  const handleInspectFaskes = (id: number) => {
    setSelectedFaskesId(id);
    router.push('/triage');
    toast.info('Beralih ke antrean faskes terpilih');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="size-6 text-teal-600" />
              Panel Agregat Epidemiologi Nifas Surabaya
            </h1>
            <Badge variant="default" className="bg-emerald-700 text-white text-xs">
              Super Admin Dinkes
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pantauan menyeluruh capaian pemantauan ibu nifas di 3 Rumah Sakit Rujukan dan 10 Puskesmas Mitra Surabaya.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Download className="size-3.5" />
          <span>Ekspor Laporan (CSV)</span>
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="size-3.5 text-teal-600" /> Total Ibu Terpantau
            </span>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {cityKpis.totalAktif}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Target Pilot: {cityKpis.targetPilot} ibu ({((cityKpis.totalAktif / cityKpis.targetPilot) * 100).toFixed(1)}%)
            </span>
          </CardContent>
        </Card>

        <Card className="border border-rose-200 bg-rose-50/20 dark:bg-rose-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5">
              <AlertOctagon className="size-3.5 text-rose-600" /> Kasus Bahaya (Merah)
            </span>
            <div className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
              {cityKpis.totalMerah}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Perdarahan / Sepsis / Hipertensi
            </span>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-600" /> Kasus Waspada (Kuning)
            </span>
            <div className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-400">
              {cityKpis.totalKuning}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Bendungan ASI / Skrining EPDS
            </span>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" /> Total Respon Skrining
            </span>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {cityKpis.totalSkrining}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Respon bot terverifikasi Buku KIA
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabel 13 Faskes Mitra Surabaya */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-5 text-teal-600" />
                Matriks Kinerja 13 Faskes Mitra Surabaya
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Pemantauan terdistribusi 3 RSUD Rujukan dan 10 Puskesmas percontohan.
              </CardDescription>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari faskes..."
                  className="pl-8 text-xs h-8"
                />
              </div>

              <div className="flex rounded-md border p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setKategoriFilter('ALL')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    kategoriFilter === 'ALL' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setKategoriFilter('RSUD')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    kategoriFilter === 'RSUD' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  RSUD
                </button>
                <button
                  type="button"
                  onClick={() => setKategoriFilter('PUSKESMAS')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    kategoriFilter === 'PUSKESMAS' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Puskesmas
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-muted/30">
                  <TableHead className="w-12 text-center font-bold">No</TableHead>
                  <TableHead className="font-bold">Fasilitas Kesehatan</TableHead>
                  <TableHead className="font-bold">Kategori</TableHead>
                  <TableHead className="text-center font-bold">Pasien Aktif</TableHead>
                  <TableHead className="text-center font-bold text-rose-600">🔴 Merah</TableHead>
                  <TableHead className="text-center font-bold text-amber-600">🟡 Kuning</TableHead>
                  <TableHead className="text-center font-bold text-emerald-600">🟢 Hijau</TableHead>
                  <TableHead className="font-bold">Bidan PJ / Kontak</TableHead>
                  <TableHead className="text-right font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredFaskes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                      Tidak ada faskes yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaskes.map((f, idx) => (
                    <TableRow key={f.id} className="text-xs hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{f.nama_faskes}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {f.kode_faskes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={f.kategori === 'RSUD' ? 'default' : 'secondary'}
                          className="text-[10px] font-semibold"
                        >
                          {f.kategori}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {f.total_aktif || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded ${
                            (f.summary?.merah || 0) > 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {f.summary?.merah || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded ${
                            (f.summary?.kuning || 0) > 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {f.summary?.kuning || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium text-emerald-700">
                        {f.summary?.hijau || 0}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[11px]">
                          {f.no_telp_bidan_pj || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInspectFaskes(f.id)}
                          className="text-xs h-7 gap-1 text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                        >
                          <span>Pantau</span>
                          <ExternalLink className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Catatan Kepatuhan Regulasi */}
      <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground flex items-start gap-2.5">
        <ShieldCheck className="size-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <strong className="text-foreground">Kepatuhan Data & Privasi Pasien (UU PDP No. 27/2022):</strong> Seluruh rekam klinis ibu nifas disimpan pada infrastruktur cloud lokal Biznet GIO Surabaya/Jakarta dengan prinsip isolasi data multi-tenant antar-faskes.
        </div>
      </div>
    </div>
  );
}
