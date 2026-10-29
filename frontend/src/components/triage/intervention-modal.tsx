'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionType, CaseStatus, TriageQueueItem } from '@/lib/types';
import { recordIntervention } from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';
import { toast } from 'sonner';
import { Stethoscope, CheckCircle2 } from 'lucide-react';

interface InterventionModalProps {
  item: TriageQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InterventionModal({
  item,
  open,
  onOpenChange,
  onSuccess,
}: InterventionModalProps) {
  const { selectedFaskesId, role } = useTenant();
  const [actionType, setActionType] = useState<ActionType>('WA_ANAMNESIS');
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('RESOLVED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Catatan klinis wajib diisi sebelum menyimpan');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordIntervention(
        {
          mother_id: item.mother_id,
          screening_log_id: item.log_id,
          triase_level: item.triage_result,
          jenis_tindakan: actionType,
          catatan_klinis: notes.trim(),
          status_kasus: caseStatus,
        },
        { faskesId: selectedFaskesId, userRole: role }
      );

      toast.success('Tindakan klinis berhasil didokumentasikan', {
        description: `Kasus ${item.nama_ibu} telah diperbarui menjadi ${caseStatus}.`,
      });
      setNotes('');
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan tindakan';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Stethoscope className="size-5" />
              <DialogTitle>Catat Tindakan / Intervensi Bidan</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Dokumentasi penanganan keluhan masa nifas untuk pasien{' '}
              <strong className="text-foreground">{item.nama_ibu}</strong> ({item.milestone} -{' '}
              {item.nama_faskes}).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-3">
            {/* Ringkasan Keluhan */}
            <div className="rounded-lg bg-muted/60 p-3 text-xs flex flex-col gap-1 border">
              <div>
                <span className="text-muted-foreground">Gejala Terdeteksi: </span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {item.gejala || item.jawaban_pasien || 'Tidak ada keluhan spesifik'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Balasan Asli WA: </span>
                <span className="font-mono text-foreground">{item.jawaban_pasien || '-'}</span>
              </div>
            </div>

            {/* Pilihan Jenis Tindakan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Jenis Tindakan Nakes:
              </label>
              <Select
                value={actionType}
                onValueChange={(val) => val && setActionType(val as ActionType)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih jenis tindakan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WA_ANAMNESIS">
                    💬 Anamnesis Lanjutan via WhatsApp (Bidan ke Ibu)
                  </SelectItem>
                  <SelectItem value="TELEPON_SUAMI">
                    📞 Panggilan Telepon ke Suami (Kontak Darurat)
                  </SelectItem>
                  <SelectItem value="KUNJUNGAN_RUMAH">
                    🏠 Kunjungan Rumah / Home Visit oleh Bidan
                  </SelectItem>
                  <SelectItem value="KONTROL_FASKES">
                    🏥 Penjadwalan Kontrol Fisik ke Faskes
                  </SelectItem>
                  <SelectItem value="RUJUK_RSUD">
                    🚑 Rujukan Cito ke IGD RSUD (Dr. Soetomo/BDH/Soewandhie)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Kasus Setelah Tindakan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Status Kasus Pasca Penanganan:
              </label>
              <Select
                value={caseStatus}
                onValueChange={(val) => val && setCaseStatus(val as CaseStatus)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih status kasus..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESOLVED">
                    ✅ Selesai / Teratasi (Keluhan tertangani secara klinis)
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    ⏳ Dalam Pengawasan (Menunggu hasil observasi 1x24 jam)
                  </SelectItem>
                  <SelectItem value="REFERRED">
                    🚑 Telah Dirujuk ke RSUD Rujukan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catatan Klinis Bidan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Catatan Hasil Anamnesis & Tindakan Klinis:
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sudah dihubungi via WA. Ibu mengeluh bendungan ASI di payudara kanan. Diberikan KIE kompres hangat, teknik menyusui, dan jadwal kontrol besok jika masih demam..."
                rows={3}
                className="text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
              disabled={isSubmitting}
            >
              <CheckCircle2 className="size-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tindakan'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
