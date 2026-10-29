'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TriageQueueItem } from '@/lib/types';
import {
  MessageCircle,
  PhoneCall,
  ClipboardPen,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriageCardProps {
  item: TriageQueueItem;
  onOpenIntervention: (item: TriageQueueItem) => void;
}

export function TriageCard({ item, onOpenIntervention }: TriageCardProps) {
  const isRed = item.triage_result === 'MERAH';
  const isYellow = item.triage_result === 'KUNING';
  const isGreen = item.triage_result === 'HIJAU';

  const getTriageBadge = () => {
    if (isRed) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 font-semibold tracking-wide">
          <AlertOctagon className="size-3.5" />
          🔴 MERAH (BAHAYA KRITIS)
        </Badge>
      );
    }
    if (isYellow) {
      return (
        <Badge
          variant="outline"
          className="border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 flex items-center gap-1 font-semibold"
        >
          <AlertTriangle className="size-3.5 text-amber-600" />
          🟡 KUNING (WASPADA)
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-1 font-semibold"
      >
        <CheckCircle className="size-3.5 text-emerald-600" />
        🟢 HIJAU (STABIL)
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 border-2 shadow-xs hover:shadow-md flex flex-col justify-between',
        isRed && 'border-rose-400/80 bg-rose-50/30 dark:bg-rose-950/20',
        isYellow && 'border-amber-300/80 bg-amber-50/20 dark:bg-amber-950/10',
        isGreen && 'border-emerald-200/60 bg-emerald-50/10 dark:bg-emerald-950/10'
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <User className="size-4 text-muted-foreground" />
                {item.nama_ibu}
              </h3>
              <Badge variant="secondary" className="text-xs font-semibold">
                {item.milestone}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building className="size-3.5" />
              <span>{item.nama_faskes}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {getTriageBadge()}
            {item.is_intervened ? (
              <Badge variant="outline" className="border-teal-500 text-teal-700 bg-teal-50 text-[10px] py-0">
                ✓ Ditangani Nakes
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] py-0',
                  isRed ? 'border-rose-500 text-rose-700 bg-rose-50 animate-pulse' : 'text-muted-foreground'
                )}
              >
                Belum Ditangani
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 py-2 flex flex-col gap-2.5">
        {/* Gejala Klinis & Jawaban Pesan */}
        <div className="rounded-md border bg-background/80 p-3 text-xs flex flex-col gap-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <span>Keluhan yang Dilaporkan Pasien:</span>
          </div>
          <div
            className={cn(
              'font-medium text-xs leading-relaxed',
              isRed && 'text-rose-700 dark:text-rose-400 font-semibold',
              isYellow && 'text-amber-800 dark:text-amber-300 font-medium',
              isGreen && 'text-emerald-700 dark:text-emerald-400'
            )}
          >
            "{item.gejala || item.jawaban_pasien || 'Kondisi nifas dilaporkan normal tanpa keluhan.'}"
          </div>
          {item.jawaban_pasien && item.jawaban_pasien !== item.gejala && (
            <div className="text-[11px] text-muted-foreground font-mono">
              Input WhatsApp: [ {item.jawaban_pasien} ]
            </div>
          )}
        </div>

        {/* Info Kontak & Waktu Respon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">WA Ibu: </span>
            <span className="font-mono">{item.no_wa_suami || 'Aktif'}</span>
          </div>
          {item.nama_suami && (
            <div>
              <span className="font-medium text-foreground">Kontak Darurat: </span>
              <span>
                {item.nama_suami} ({item.no_wa_suami || '-'})
              </span>
            </div>
          )}
          {item.responded_at && (
            <div className="sm:col-span-2 flex items-center gap-1 text-[11px]">
              <Clock className="size-3 text-muted-foreground" />
              <span>
                Laporan masuk:{' '}
                {new Date(item.responded_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Tindakan Terakhir jika sudah ada */}
        {item.latest_intervention && (
          <div className="rounded border border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 p-2 text-[11px] text-teal-900 dark:text-teal-200">
            <strong>Intervensi:</strong> {item.latest_intervention.jenis_tindakan} —{' '}
            <em>"{item.latest_intervention.catatan_klinis}"</em>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2 border-t flex flex-wrap items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          {/* Tombol 1-Klik Hubungi Ibu via WhatsApp */}
          <a
            href={item.wa_me_mother_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow-xs'
            )}
          >
            <MessageCircle className="size-3.5" />
            <span>Hubungi Ibu (WA)</span>
          </a>

          {/* Tombol Fail-Safe Hubungi Suami (Kontak Darurat) */}
          {item.wa_me_husband_url && (
            <a
              href={item.wa_me_husband_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'text-xs gap-1.5',
                isRed
                  ? 'border-rose-400 text-rose-700 hover:bg-rose-50'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <PhoneCall className="size-3.5 text-rose-600" />
              <span>Kontak Suami</span>
            </a>
          )}
        </div>

        {/* Tombol Catat Tindakan Klinis */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenIntervention(item)}
          className="text-xs gap-1.5 border-teal-600/40 text-teal-800 hover:bg-teal-50 dark:text-teal-300"
        >
          <ClipboardPen className="size-3.5 text-teal-600" />
          <span>Catat Tindakan</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
