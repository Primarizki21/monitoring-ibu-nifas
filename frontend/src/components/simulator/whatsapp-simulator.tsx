'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchMothers, simulateWebhookResponse } from '@/lib/api';
import { Mother } from '@/lib/types';
import { Sparkles, Send, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface WhatsAppSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSimulationSuccess?: () => void;
}

export function WhatsAppSimulator({
  open,
  onOpenChange,
  onSimulationSuccess,
}: WhatsAppSimulatorProps) {
  const [mothers, setMothers] = useState<Mother[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (open) {
      loadMothers();
    }
  }, [open]);

  const loadMothers = async () => {
    try {
      const list = await fetchMothers();
      setMothers(list);
      if (list.length > 0 && !selectedPhone) {
        setSelectedPhone(list[0].no_wa_ibu);
      }
    } catch (err) {
      console.error('Failed to load mothers in simulator:', err);
    }
  };

  const handleSend = async (text: string) => {
    if (!selectedPhone) {
      toast.error('Pilih nomor WhatsApp ibu nifas terlebih dahulu');
      return;
    }
    setIsLoading(true);
    setLastResponse(null);
    try {
      const res = await simulateWebhookResponse(selectedPhone, text);
      setLastResponse(res);

      if (res.triage_result === 'MERAH') {
        toast.error('🚨 ALERT MERAH: Pasien melaporkan tanda bahaya kritis!', {
          description: 'Sistem langsung memicu kontak darurat dan eskalasi ke Bidan PJ.',
        });
      } else if (res.triage_result === 'KUNING') {
        toast.warning('🟡 ALERT KUNING: Keluhan masa nifas terdeteksi', {
          description: 'Pesan diteruskan ke bidan faskes untuk panduan penanganan.',
        });
      } else if (res.triage_result === 'HIJAU') {
        toast.success('🟢 STATUS HIJAU: Kondisi ibu stabil dan aman', {
          description: 'Edukasi pemulihan nifas otomatis dikirim ke ibu.',
        });
      } else if (res.status === 'onboarding_confirmed') {
        toast.success('✅ Onboarding Berhasil: Pasien membalas YA', {
          description: 'Status pemantauan ibu kini AKTIF untuk 42 hari nifas.',
        });
      } else {
        toast.info(`Webhook diterima: ${res.status || 'Terkirim'}`);
      }

      if (onSimulationSuccess) {
        onSimulationSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      toast.error(`Gagal simulasi: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMother = mothers.find((m) => m.no_wa_ibu === selectedPhone);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <Sparkles className="size-5" />
            <SheetTitle className="text-base sm:text-lg">Simulator WhatsApp Bot</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            Alat demonstrasi interaktif saat pitching: menembakkan balasan ibu nifas langsung ke webhook backend tanpa menunggu jam reminder.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 py-4">
          {/* Pilih Pasien */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground">
              Pilih Pasien Ibu Nifas:
            </label>
            {mothers.length > 0 ? (
              <Select value={selectedPhone} onValueChange={(val) => val && setSelectedPhone(val)}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih ibu nifas..." />
                </SelectTrigger>
                <SelectContent>
                  {mothers.map((m) => (
                    <SelectItem key={m.id} value={m.no_wa_ibu}>
                      {m.nama_ibu} ({m.no_wa_ibu}) - Status: {m.status_pemantauan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={selectedPhone}
                  onChange={(e) => setSelectedPhone(e.target.value)}
                  placeholder="Nomor WA (contoh: 081234567890)"
                  className="text-xs"
                />
                <Button size="sm" variant="outline" onClick={loadMothers}>
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            )}
            {selectedMother && (
              <div className="rounded-md bg-muted/60 p-2.5 text-[11px] text-muted-foreground flex flex-col gap-1">
                <div>
                  <strong className="text-foreground">Nama:</strong> {selectedMother.nama_ibu} |{' '}
                  <strong className="text-foreground">Partus:</strong>{' '}
                  {new Date(selectedMother.waktu_persalinan).toLocaleDateString('id-ID')}
                </div>
                <div>
                  <strong className="text-foreground">Status:</strong>{' '}
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {selectedMother.status_pemantauan}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-foreground">
              Pilih Skenario Respon Balasan:
            </span>

            {/* Skenario 1: Onboarding YA */}
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSend('YA')}
              className="justify-start gap-2 border-slate-300 dark:border-slate-700 text-xs text-left h-auto py-2"
            >
              <CheckCircle className="size-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold text-foreground">Konfirmasi Onboarding: Balas "YA"</div>
                <div className="text-[10px] text-muted-foreground">
                  Validasi nomor aktif & persetujuan awal pemantauan nifas 42 hari.
                </div>
              </div>
            </Button>

            {/* Skenario 2: Merah (Bahaya) */}
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSend('2')}
              className="justify-start gap-2 border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-xs text-left h-auto py-2"
            >
              <ShieldAlert className="size-4 text-rose-600 shrink-0" />
              <div>
                <div className="font-semibold text-rose-700 dark:text-rose-400">
                  🔴 Respon Bahaya / Kritis: Balas "2" (KF1/KF3)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Perdarahan deras, nyeri kepala hebat, atau infeksi luka jahitan.
                </div>
              </div>
            </Button>

            {/* Skenario 3: Kuning (Waspada) */}
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSend('2')}
              className="justify-start gap-2 border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-left h-auto py-2"
            >
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <div>
                <div className="font-semibold text-amber-800 dark:text-amber-400">
                  🟡 Respon Waspada: Balas "2" (KF2/KF4)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Payudara bengkak, puting lecet, atau kecemasan/baby blues.
                </div>
              </div>
            </Button>

            {/* Skenario 4: Hijau (Aman) */}
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleSend('1')}
              className="justify-start gap-2 border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-left h-auto py-2"
            >
              <CheckCircle className="size-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-800 dark:text-emerald-400">
                  🟢 Respon Aman: Balas "1"
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Kondisi pemulihan baik, cairan nifas normal, tidak ada keluhan.
                </div>
              </div>
            </Button>
          </div>

          {/* Custom Text Option */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground">
              Atau Ketik Balasan Manual:
            </label>
            <div className="flex gap-2">
              <Input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Ketik angka (1, 2, 3) atau teks bebas..."
                className="text-xs"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customText) {
                    handleSend(customText);
                    setCustomText('');
                  }
                }}
              />
              <Button
                size="sm"
                disabled={isLoading || !customText}
                onClick={() => {
                  handleSend(customText);
                  setCustomText('');
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Log Balasan dari Backend */}
          {lastResponse && (
            <Card className="border bg-slate-900 text-slate-100 dark:bg-black text-[11px] font-mono">
              <CardContent className="p-3 flex flex-col gap-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-semibold">
                  Respon Balik Bot Meta WhatsApp:
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-slate-200">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
