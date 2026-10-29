'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { fetchTriageQueue } from '@/lib/api';
import { TriageQueueItem, TriageResult } from '@/lib/types';
import { TriageCard } from '@/components/triage/triage-card';
import { InterventionModal } from '@/components/triage/intervention-modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, HeartPulse, AlertOctagon, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function TriagePage() {
  const { selectedFaskesId, role, currentFaskes } = useTenant();
  const [queue, setQueue] = useState<TriageQueueItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | TriageResult>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItemForIntervention, setSelectedItemForIntervention] =
    useState<TriageQueueItem | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = activeFilter === 'ALL' ? null : activeFilter;
      const data = await fetchTriageQueue(filter, {
        faskesId: selectedFaskesId,
        userRole: role,
      });
      setQueue(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat antrean triase';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, selectedFaskesId, role]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Statistik triase di faskes saat ini
  const stats = useMemo(() => {
    const red = queue.filter((i) => i.triage_result === 'MERAH').length;
    const yellow = queue.filter((i) => i.triage_result === 'KUNING').length;
    const green = queue.filter((i) => i.triage_result === 'HIJAU').length;
    const unhandledRed = queue.filter((i) => i.triage_result === 'MERAH' && !i.is_intervened).length;
    return { red, yellow, green, unhandledRed, total: queue.length };
  }, [queue]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HeartPulse className="size-6 text-teal-600" />
              Antrean Triase Nifas Harian
            </h1>
            <Badge variant="outline" className="text-xs">
              {currentFaskes ? currentFaskes.nama_faskes : 'Seluruh Surabaya'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Triase otomatis berbasis respon bot WhatsApp Buku KIA Kemenkes RI (KF1–KF4).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Warning Banner jika ada kasus Merah belum ditangani */}
      {stats.unhandledRed > 0 && (
        <div className="rounded-lg border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="size-6 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 text-xs sm:text-sm">
            <div className="font-bold flex items-center gap-2">
              <span>PERHATIAN: Ada {stats.unhandledRed} Ibu Nifas Berstatus Merah Memerlukan Tindakan Segera!</span>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">
              Pasien melaporkan tanda bahaya kritis (perdarahan deras, demam infeksi, atau preeklampsia). Segera klik <strong>Hubungi Ibu (WA)</strong> atau <strong>Kontak Suami</strong> untuk anamnesis dan persiapan rujukan.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Total Kasus Lapor</span>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
            <span className="text-[11px] text-muted-foreground">Periode aktif saat ini</span>
          </CardContent>
        </Card>

        <Card className="border border-rose-200 bg-rose-50/20 dark:bg-rose-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertOctagon className="size-3.5" /> 🔴 Merah (Kritis)
              </span>
              {stats.unhandledRed > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {stats.unhandledRed} Baru
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
              {stats.red}
            </div>
            <span className="text-[11px] text-muted-foreground">Tanda bahaya Kemenkes</span>
          </CardContent>
        </Card>

        <Card className="border border-amber-200 bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-amber-800 dark:text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="size-3.5 text-amber-600" /> 🟡 Kuning (Waspada)
            </span>
            <div className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-400">
              {stats.yellow}
            </div>
            <span className="text-[11px] text-muted-foreground">Keluhan ASI / Depresi</span>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="size-3.5 text-emerald-600" /> 🟢 Hijau (Aman)
            </span>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {stats.green}
            </div>
            <span className="text-[11px] text-muted-foreground">Pemulihan normal</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between border-b pb-3">
        <Tabs
          value={activeFilter}
          onValueChange={(val) => setActiveFilter(val as 'ALL' | TriageResult)}
          className="w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto h-9">
            <TabsTrigger value="ALL" className="text-xs">
              Semua ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="MERAH" className="text-xs text-rose-600 font-semibold">
              🔴 Merah ({stats.red})
            </TabsTrigger>
            <TabsTrigger value="KUNING" className="text-xs text-amber-700 font-semibold">
              🟡 Kuning ({stats.yellow})
            </TabsTrigger>
            <TabsTrigger value="HIJAU" className="text-xs text-emerald-700 font-semibold">
              🟢 Hijau ({stats.green})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Queue Grid / States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 flex flex-col gap-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <Card className="border-dashed p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <CheckCircle className="size-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">Tidak Ada Antrean Triase</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {activeFilter !== 'ALL'
                ? `Tidak ada pasien dengan kategori status ${activeFilter} pada faskes ini.`
                : 'Belum ada laporan keluhan yang masuk. Gunakan tombol "Simulasi WA Bot" di kanan bawah untuk menguji respon masuk.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map((item) => (
            <TriageCard
              key={`${item.log_id}-${item.mother_id}`}
              item={item}
              onOpenIntervention={(i) => setSelectedItemForIntervention(i)}
            />
          ))}
        </div>
      )}

      {/* Intervention Modal Dialog */}
      <InterventionModal
        item={selectedItemForIntervention}
        open={selectedItemForIntervention !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItemForIntervention(null);
        }}
        onSuccess={loadQueue}
      />
    </div>
  );
}
