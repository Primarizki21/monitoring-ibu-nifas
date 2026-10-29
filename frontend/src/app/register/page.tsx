'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchMasterWilayah,
  fetchMasterRumahSakit,
  createDischarge,
} from '@/lib/api';
import {
  MasterWilayahKecamatan,
  MasterRumahSakit,
  TipeFaskesRujukan,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Building2,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  SendHorizontal,
  Copy,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterDischargePage() {
  const router = useRouter();

  // Master Data State
  const [wilayahList, setWilayahList] = useState<MasterWilayahKecamatan[]>([]);
  const [rsList, setRsList] = useState<MasterRumahSakit[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // Form States
  const [nik, setNik] = useState('');
  const [namaIbu, setNamaIbu] = useState('');
  const [noWaIbu, setNoWaIbu] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');

  // Cascading Wilayah State
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedKelurahanId, setSelectedKelurahanId] = useState<string>('');

  // Clinical KRS States
  const [selectedRsId, setSelectedRsId] = useState<string>('');
  const [diagnosisSebelumPulang, setDiagnosisSebelumPulang] = useState('Post partum normal hari ke-2');
  const [diagnosisPerawatan, setDiagnosisPerawatan] = useState('Perawatan luka jahitan perineum derajat 2');
  const [rekomendasiPerawatan, setRekomendasiPerawatan] = useState(
    'Jaga higienitas luka jahitan, minum tablet Fe rutin, konsumsi makanan tinggi protein, dan istirahat cukup.'
  );
  const [jadwalKontrol, setJadwalKontrol] = useState('');
  const [faskesTujuan, setFaskesTujuan] = useState<TipeFaskesRujukan>('PUSKESMAS');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result Success Dialog State
  const [createdData, setCreatedData] = useState<{
    discharge_id: string;
    token_kunjungan: string;
    deadline_sla: string;
    nama_ibu: string;
    nik: string;
    url_kunjungan: string;
  } | null>(null);

  // Load Master Data
  useEffect(() => {
    async function loadMaster() {
      setIsLoadingMaster(true);
      try {
        const [wRes, rsRes] = await Promise.all([
          fetchMasterWilayah(),
          fetchMasterRumahSakit(),
        ]);
        setWilayahList(wRes.data);
        setRsList(rsRes.data);

        if (wRes.data.length > 0) {
          const firstKec = wRes.data[0];
          setSelectedKecamatan(firstKec.kecamatan);
          const firstKel = firstKec.puskesmas[0]?.kelurahan[0];
          if (firstKel) setSelectedKelurahanId(firstKel.id);
        }

        if (rsRes.data.length > 0) {
          setSelectedRsId(rsRes.data[0].id);
        }
      } catch (err) {
        toast.error('Gagal memuat master wilayah dan rumah sakit');
      } finally {
        setIsLoadingMaster(false);
      }
    }
    loadMaster();
    const d = new Date();
    d.setDate(d.getDate() + 5);
    setJadwalKontrol(d.toISOString().split('T')[0]);
  }, []);
  // Filter kelurahan berdasarkan kecamatan terpilih
  const availableKelurahan = useMemo(() => {
    if (!selectedKecamatan) return [];
    const kec = wilayahList.find((k) => k.kecamatan === selectedKecamatan);
    if (!kec) return [];

    const list: { id: string; nama_kelurahan: string; puskesmas_nama: string }[] = [];
    for (const p of kec.puskesmas) {
      for (const kel of p.kelurahan) {
        list.push({
          id: kel.id,
          nama_kelurahan: kel.nama_kelurahan,
          puskesmas_nama: p.nama_puskesmas,
        });
      }
    }
    return list;
  }, [selectedKecamatan, wilayahList]);

  // Info Puskesmas Pembina otomatis
  const assignedPuskesmasInfo = useMemo(() => {
    if (!selectedKelurahanId) return null;
    return availableKelurahan.find((k) => k.id === selectedKelurahanId);
  }, [selectedKelurahanId, availableKelurahan]);

  // Kalkulasi SLA 48 Jam
  const [slaPreview, setSlaPreview] = useState({
    t0: 'Memuat...',
    deadline: 'Memuat...',
  });

  useEffect(() => {
    const now = new Date();
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    setSlaPreview({
      t0: now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      deadline: deadline.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    });
  }, []);

  const handleKecamatanChange = (kec: string) => {
    setSelectedKecamatan(kec);
    const targetKec = wilayahList.find((k) => k.kecamatan === kec);
    if (targetKec && targetKec.puskesmas[0]?.kelurahan[0]) {
      setSelectedKelurahanId(targetKec.puskesmas[0].kelurahan[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nik || nik.length !== 16) {
      toast.error('NIK wajib 16 digit angka sesuai KTP');
      return;
    }
    if (!namaIbu.trim()) {
      toast.error('Nama lengkap ibu nifas wajib diisi');
      return;
    }
    if (!noWaIbu.trim()) {
      toast.error('Nomor WhatsApp aktif wajib diisi');
      return;
    }
    if (!selectedKelurahanId) {
      toast.error('Pilih kelurahan domisili pasien');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createDischarge({
        nik: nik.trim(),
        nama_ibu: namaIbu.trim(),
        alamat_lengkap: alamatLengkap.trim(),
        kelurahan_id: selectedKelurahanId,
        no_whatsapp_ibu: noWaIbu.trim(),
        diagnosis_sebelum_pulang: diagnosisSebelumPulang.trim(),
        diagnosis_perawatan: diagnosisPerawatan.trim(),
        rekomendasi_perawatan_rumah: rekomendasiPerawatan.trim(),
        jadwal_kunjungan_ulang: jadwalKontrol,
        faskes_kunjungan_ulang: faskesTujuan,
        rs_asal_id: selectedRsId,
      });

      toast.success('Pasien berhasil dipulangkan. Tugas kunjungan diteruskan ke Bidan Kelurahan.');
      setCreatedData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data KRS';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Tautan berhasil disalin ke clipboard');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Halaman */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="size-6 text-teal-600" />
            Form Pemulangan Pasien (Discharge Planning KRS)
          </h1>
          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200">
            PRD Modul Bidan RS
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Input rekam klinis kepulangan ibu nifas, validasi wilayah domisili Surabaya, dan penegakan SLA Kunjungan Rumah 48 Jam.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Form Input Utama */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Seksi 1: Data Identitas Pasien */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="size-4 text-teal-600" />
                1. Identitas Pasien & Kontak WhatsApp
              </CardTitle>
              <CardDescription className="text-xs">
                Data resmi identitas ibu nifas sesuai KTP dan nomor WhatsApp aktif penerima edukasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  NIK Pasien (16 Digit) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  maxLength={16}
                  placeholder="Contoh: 3578012345670001"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  {nik.length}/16 digit {nik.length === 16 ? '✓ Valid' : ''}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nama Lengkap Ibu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Nama lengkap ibu nifas"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Nomor WhatsApp Aktif Pasien <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="Contoh: 081234567890 atau +6281234567890"
                  value={noWaIbu}
                  onChange={(e) => setNoWaIbu(e.target.value)}
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Menerima pesan otomatis jadwal kontrol dan pengingat 5 tanda bahaya nifas.
                </span>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Alamat Lengkap Domisili <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={2}
                  placeholder="Nama jalan, gang, nomor rumah, RT/RW tujuan kepulangan"
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Seksi 2: Pemilihan Wilayah Berjenjang (Cascading Dropdown) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="size-4 text-teal-600" />
                2. Pemetaan Wilayah & Penugasan Bidan
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih Kecamatan dan Kelurahan domisili untuk mengunci penugasan Bidan Kelurahan pembina.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Kecamatan Domisili</label>
                <Select value={selectedKecamatan} onValueChange={(val) => val && handleKecamatanChange(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayahList.map((kec) => (
                      <SelectItem key={kec.kecamatan} value={kec.kecamatan}>
                        Kecamatan {kec.kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Kelurahan Domisili</label>
                <Select value={selectedKelurahanId} onValueChange={(val) => val && setSelectedKelurahanId(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kelurahan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableKelurahan.map((kel) => (
                      <SelectItem key={kel.id} value={kel.id}>
                        Kelurahan {kel.nama_kelurahan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignedPuskesmasInfo && (
                <div className="sm:col-span-2 rounded-md bg-muted/60 p-3 text-xs flex items-center justify-between border">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Puskesmas Pembina Wilayah:</span>
                    <strong className="text-foreground">{assignedPuskesmasInfo.puskesmas_nama}</strong>
                  </div>
                  <Badge variant="outline" className="text-xs bg-background text-teal-700">
                    Otomatis Terhubung
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seksi 3: Rekam Medis Pemulangan & Jadwal Kontrol */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="size-4 text-teal-600" />
                3. Data Klinis KRS & Rekomendasi
              </CardTitle>
              <CardDescription className="text-xs">
                Diagnosis pelepasan, instruksi perawatan di rumah, serta rencana kontrol ulang.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Rumah Sakit Pemulih</label>
                <Select value={selectedRsId} onValueChange={(val) => val && setSelectedRsId(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Rumah Sakit" />
                  </SelectTrigger>
                  <SelectContent>
                    {rsList.map((rs) => (
                      <SelectItem key={rs.id} value={rs.id}>
                        {rs.nama_rs} ({rs.tipe_rs})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Diagnosis Sebelum Pulang</label>
                  <Input
                    type="text"
                    value={diagnosisSebelumPulang}
                    onChange={(e) => setDiagnosisSebelumPulang(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Diagnosis Perawatan</label>
                  <Input
                    type="text"
                    value={diagnosisPerawatan}
                    onChange={(e) => setDiagnosisPerawatan(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Anjuran / Rekomendasi Perawatan di Rumah
                </label>
                <Textarea
                  rows={2}
                  value={rekomendasiPerawatan}
                  onChange={(e) => setRekomendasiPerawatan(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tanggal Jadwal Kontrol Ulang</label>
                  <Input
                    type="date"
                    value={jadwalKontrol}
                    onChange={(e) => setJadwalKontrol(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Faskes Rujukan Kontrol</label>
                  <Select
                    value={faskesTujuan}
                    onValueChange={(v) => setFaskesTujuan(v as TipeFaskesRujukan)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Faskes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUSKESMAS">Puskesmas Wilayah</SelectItem>
                      <SelectItem value="RS">Rumah Sakit Rujukan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: SLA Calculator & Action Card */}
        <div className="flex flex-col gap-6">
          {/* SLA Card */}
          <Card className="border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-teal-900 dark:text-teal-200">
                <Clock className="size-4 text-teal-600" />
                Penegakan SLA 48 Jam
              </CardTitle>
              <CardDescription className="text-xs text-teal-800/80 dark:text-teal-300/80">
                Sesuai standar PRD, Bidan Kelurahan wajib mengunjungi ibu dalam 2x24 jam sejak KRS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-teal-100 dark:border-teal-900">
                <span className="text-muted-foreground">Waktu KRS (T0):</span>
                <span className="font-semibold text-foreground">{slaPreview.t0} WIB</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-teal-100 dark:border-teal-900">
                <span className="text-muted-foreground">Batas Maks Kunjungan:</span>
                <strong className="text-teal-700 dark:text-teal-300 font-bold">
                  {slaPreview.deadline} WIB
                </strong>
              </div>
              <div className="rounded-md bg-background p-2.5 border text-[11px] text-muted-foreground">
                <strong className="text-foreground block mb-0.5">Otomatisasi Sistem:</strong>
                Saat form disubmit, sistem menerbitkan <em>unique token link</em> dan menembakkan pesan WhatsApp penugasan dalam &lt;5 detik ke Bidan Kelurahan &amp; Kepala Puskesmas.
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isSubmitting || isLoadingMaster}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 text-sm"
              >
                {isSubmitting ? 'Memproses KRS...' : 'Simpan & Pulangkan Pasien'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pedoman Indikator PRD */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Ketentuan Layanan Kota Surabaya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                • <strong>Kunjungan Tepat Waktu:</strong> Pelaporan Bidan &le; 48 jam sejak KRS.
              </p>
              <p>
                • <strong>Eskalasi 24 Jam:</strong> Sistem mengirimkan WA reminder ke Bidan di jam ke-24 jika belum dikunjungi.
              </p>
              <p>
                • <strong>Teguran 48 Jam:</strong> Sistem mengirimkan WA alert ke Kepala Puskesmas jika batas SLA terlampaui.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Dialog Hasil Sukses & Tautan Token */}
      <Dialog open={createdData !== null} onOpenChange={(open) => !open && setCreatedData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-600">
              <CheckCircle2 className="size-6 text-teal-600" />
              <DialogTitle>Pasien Berhasil Dipulangkan</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Data KRS telah tercatat di sistem dan SLA Kunjungan Rumah 48 Jam telah diaktifkan.
            </DialogDescription>
          </DialogHeader>

          {createdData && (
            <div className="space-y-4 text-xs pt-2">
              <div className="rounded-lg bg-muted/60 p-3 space-y-2 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Pasien:</span>
                  <span className="font-semibold text-foreground">{createdData.nama_ibu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIK:</span>
                  <span className="font-mono text-foreground">{createdData.nik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batas SLA Kunjungan:</span>
                  <span className="font-semibold text-teal-700">
                    {new Date(createdData.deadline_sla).toLocaleString('id-ID')} WIB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token Akses:</span>
                  <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border">
                    {createdData.token_kunjungan}
                  </span>
                </div>
              </div>

              {/* Tautan Khusus Bidan Kelurahan */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  Tautan Formulir Kunjungan Rumah (Bidan Kelurahan):
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}${createdData.url_kunjungan}`}
                    className="font-mono text-[11px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}${createdData.url_kunjungan}`
                      )
                    }
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Tautan ini otomatis dikirim ke nomor WhatsApp Bidan Kelurahan via template WA-ASSIGN-01.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link href={createdData.url_kunjungan} className="w-full">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs">
                    <ExternalLink className="size-3.5" />
                    <span>Buka Form Kunjungan Sekarang</span>
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full text-xs"
                >
                  Ke Dashboard Eksekutif
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
