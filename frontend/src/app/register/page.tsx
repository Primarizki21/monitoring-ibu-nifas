'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { registerMother } from '@/lib/api';
import { ContactRelation, DeliveryType, MotherCreatePayload } from '@/lib/types';
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
  UserPlus,
  CalendarDays,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  HeartPulse,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { faskesList, selectedFaskesId, currentFaskes, role } = useTenant();

  // Form states
  const [faskesId, setFaskesId] = useState<number>(selectedFaskesId || (faskesList[0]?.id ?? 1));
  const [namaIbu, setNamaIbu] = useState('');
  const [nik, setNik] = useState('');
  const [noRm, setNoRm] = useState('');
  const [noWaIbu, setNoWaIbu] = useState('');
  const [waktuPersalinan, setWaktuPersalinan] = useState('2026-10-29T08:00');

  React.useEffect(() => {
    const now = new Date();
    setWaktuPersalinan(now.toISOString().slice(0, 16));
  }, []);
  const [metodePersalinan, setMetodePersalinan] = useState<DeliveryType>('SPONTAN');
  const [paritas, setParitas] = useState('P1A0');
  const [catatanKhusus, setCatatanKhusus] = useState('');

  // Emergency contact
  const [namaSuami, setNamaSuami] = useState('');
  const [noWaSuami, setNoWaSuami] = useState('');
  const [hubungan, setHubungan] = useState<ContactRelation>('SUAMI');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Perhitungan Otomatis Jadwal KF1 - KF4 berdasarkan Buku KIA Kemenkes
  const timeline = useMemo(() => {
    const partusDate = new Date(waktuPersalinan);
    if (isNaN(partusDate.getTime())) return null;

    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res;
    };

    const formatDate = (d: Date) =>
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    return [
      {
        milestone: 'KF1',
        title: 'Kunjungan Nifas 1 (H+1 s/d H+2)',
        range: `${formatDate(addDays(partusDate, 1))} – ${formatDate(addDays(partusDate, 2))}`,
        fokus: 'Perdarahan primer, atonia uteri, kontraksi rahim, pusing hebat, tensi tinggi.',
        warna: 'border-l-rose-500 bg-rose-50/20 text-rose-950 dark:text-rose-200',
        badge: 'H+1 / H+2',
      },
      {
        milestone: 'KF2',
        title: 'Kunjungan Nifas 2 (H+3 s/d H+7)',
        range: `${formatDate(addDays(partusDate, 3))} – ${formatDate(addDays(partusDate, 7))}`,
        fokus: 'Lochea berbau busuk, demam nifas (>38°C), bendungan ASI, payudara nyeri/lecet.',
        warna: 'border-l-amber-500 bg-amber-50/20 text-amber-950 dark:text-amber-200',
        badge: 'H+3 s/d H+7',
      },
      {
        milestone: 'KF3',
        title: 'Kunjungan Nifas 3 (H+8 s/d H+28)',
        range: `${formatDate(addDays(partusDate, 8))} – ${formatDate(addDays(partusDate, 28))}`,
        fokus: 'Luka jahitan perineum/SC bernanah/terbuka, bengkak kaki (DVT), lochea purulenta.',
        warna: 'border-l-teal-500 bg-teal-50/20 text-teal-950 dark:text-teal-200',
        badge: 'H+8 s/d H+28',
      },
      {
        milestone: 'KF4',
        title: 'Kunjungan Nifas 4 (H+29 s/d H+42)',
        range: `${formatDate(addDays(partusDate, 29))} – ${formatDate(addDays(partusDate, 42))}`,
        fokus: 'Rencana KB pascasalin, pemulihan organ reproduksi, skrining depresi nifas (EPDS).',
        warna: 'border-l-indigo-500 bg-indigo-50/20 text-indigo-950 dark:text-indigo-200',
        badge: 'H+29 s/d H+42',
      },
    ];
  }, [waktuPersalinan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaIbu.trim() || !nik.trim() || !noWaIbu.trim()) {
      toast.error('Data utama ibu (Nama, NIK, No. WA) wajib diisi lengkap');
      return;
    }

    if (!namaSuami.trim() || !noWaSuami.trim()) {
      toast.error('Kontak darurat suami/pendamping wajib diisi sebagai fail-safe klinis');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: MotherCreatePayload = {
        faskes_id: selectedFaskesId || faskesId,
        nik: nik.trim(),
        no_rm: noRm.trim() || undefined,
        nama_ibu: namaIbu.trim(),
        no_wa_ibu: noWaIbu.trim(),
        waktu_persalinan: new Date(waktuPersalinan).toISOString(),
        metode_persalinan: metodePersalinan,
        paritas: paritas.trim() || undefined,
        catatan_khusus: catatanKhusus.trim() || undefined,
        nama_suami: namaSuami.trim(),
        no_wa_suami: noWaSuami.trim(),
        hubungan: hubungan,
      };

      const res = await registerMother(payload, {
        faskesId: selectedFaskesId,
        userRole: role,
      });

      toast.success(`Pasien ${res.nama_ibu} berhasil didaftarkan!`, {
        description: 'Jadwal otomatis KF1 s/d KF4 dan pesan onboarding telah dibuat.',
      });

      // Arahkan kembali ke antrean triase
      router.push('/triage');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan pasien';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="size-6 text-teal-600" />
            Registrasi Pasien Nifas (Discharge Planning)
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Didaftarkan saat pemulangan oleh Bidan bersama Pendamping (Suami/Keluarga) agar ibu terbebas dari beban administrasi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulir Pendaftaran (8 Kolom) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Bagian 1: Pemilihan Faskes Binaan */}
            <Card className="border shadow-2xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building className="size-4 text-teal-600" />
                  Fasilitas Kesehatan Penanggung Jawab
                </CardTitle>
                <CardDescription className="text-xs">
                  RSUD atau Puskesmas yang memantau ibu selama masa nifas 42 hari.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Select
                  value={String(selectedFaskesId || faskesId)}
                  onValueChange={(val) => val && setFaskesId(Number(val))}
                  disabled={selectedFaskesId !== null}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Pilih faskes..." />
                  </SelectTrigger>
                  <SelectContent>
                    {faskesList.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        🏥 {f.nama_faskes} ({f.kategori})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFaskesId !== null && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    *Terkunci pada faskes aktif: <strong>{currentFaskes?.nama_faskes}</strong>. Ubah faskes di header atas jika diperlukan.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bagian 2: Data Ibu & Persalinan */}
            <Card className="border shadow-2xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <HeartPulse className="size-4 text-teal-600" />
                  Data Klinis Ibu & Persalinan
                </CardTitle>
                <CardDescription className="text-xs">
                  Sesuai data Buku KIA / resume medis persalinan RS/Puskesmas.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-2 flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Nama Lengkap Ibu <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={namaIbu}
                      onChange={(e) => setNamaIbu(e.target.value)}
                      placeholder="Contoh: Siti Rahmawati"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      NIK Ibu (16 Digit) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      placeholder="Contoh: 357801xxxxxxxxxx"
                      maxLength={16}
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Nomor WhatsApp Ibu <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={noWaIbu}
                      onChange={(e) => setNoWaIbu(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="text-xs font-mono"
                      required
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Menerima reminder otomatis jadwal KF1 s/d KF4.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Nomor Rekam Medis (RM)
                    </label>
                    <Input
                      value={noRm}
                      onChange={(e) => setNoRm(e.target.value)}
                      placeholder="Opsional (misal: RM-2026-089)"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Tanggal & Jam Persalinan <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={waktuPersalinan}
                      onChange={(e) => setWaktuPersalinan(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Metode Persalinan <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={metodePersalinan}
                      onValueChange={(val) => val && setMetodePersalinan(val as DeliveryType)}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPONTAN">Normal Spontan (Pervaginam)</SelectItem>
                        <SelectItem value="SC">Seksio Sesarea (SC / Operasi)</SelectItem>
                        <SelectItem value="TINDAKAN">Tindakan Khusus (Vakum / Forsep)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Paritas (Gravida / Partus / Abortus)
                    </label>
                    <Input
                      value={paritas}
                      onChange={(e) => setParitas(e.target.value)}
                      placeholder="Contoh: G2P1A0"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">
                    Catatan Khusus Bidan (Kondisi Risiko / Riwayat Komplikasi)
                  </label>
                  <Textarea
                    value={catatanKhusus}
                    onChange={(e) => setCatatanKhusus(e.target.value)}
                    placeholder="Contoh: Riwayat preeklampsia postpartum, jahitan perineum grade 2, risiko bendungan ASI..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bagian 3: Kontak Darurat (Emergency Fail-Safe) */}
            <Card className="border border-rose-200/80 bg-rose-50/15 dark:bg-rose-950/10 shadow-2xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-900 dark:text-rose-300">
                  <Phone className="size-4 text-rose-600" />
                  Kontak Darurat Pendamping (Emergency Fail-Safe)
                </CardTitle>
                <CardDescription className="text-xs">
                  Wajib dicatat saat discharge planning: dihubungi sistem jika ibu tidak merespons skrining berkala (&gt;24 jam) atau terdeteksi tanda bahaya merah kritis.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-2 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Nama Pendamping / Suami <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={namaSuami}
                      onChange={(e) => setNamaSuami(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Hubungan Keluarga <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={hubungan}
                      onValueChange={(val) => val && setHubungan(val as ContactRelation)}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUAMI">Suami</SelectItem>
                        <SelectItem value="ORANG_TUA">Orang Tua (Ibu/Ayah Kandung/Mertua)</SelectItem>
                        <SelectItem value="KELUARGA_LAIN">Keluarga Lain / Kerabat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">
                    Nomor WhatsApp Darurat Pendamping <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={noWaSuami}
                    onChange={(e) => setNoWaSuami(e.target.value)}
                    placeholder="Contoh: 081987654321"
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-2.5 gap-2 shadow-xs"
            >
              <CheckCircle2 className="size-4" />
              <span>{isSubmitting ? 'Mendaftarkan ke Sistem...' : 'Daftarkan Pasien & Terbitkan Jadwal KF'}</span>
            </Button>
          </form>
        </div>

        {/* Kolom Kanan: Live Interactive Timeline Calculator (5 Kolom) */}
        <div className="lg:col-span-5 sticky top-20">
          <Card className="border shadow-xs">
            <CardHeader className="p-4 pb-2 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="size-4 text-teal-600" />
                  Kalkulator Jadwal KF (Buku KIA)
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  42 Hari Penuh
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Sistem mengalkulasi kalender pengiriman pesan skrining deterministik berdasarkan tanggal partus.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 flex flex-col gap-3">
              {timeline ? (
                timeline.map((item) => (
                  <div
                    key={item.milestone}
                    className={`rounded-lg border-l-4 p-3 text-xs flex flex-col gap-1 ${item.warna} border`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-foreground font-bold">{item.milestone} — {item.title}</strong>
                      <Badge variant="secondary" className="text-[10px] py-0 font-mono">
                        {item.badge}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{item.range}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      <strong>Fokus Klinis:</strong> {item.fokus}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="size-6 text-muted-foreground" />
                  <span>Masukkan tanggal persalinan yang valid untuk melihat kalkulasi jadwal.</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-2 border-t bg-muted/10 text-[11px] text-muted-foreground flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <ShieldCheck className="size-3.5 text-teal-600" />
                <span>Zero Medical Hallucination:</span>
              </div>
              <p>
                Seluruh pesan dikirim menggunakan template pesan baku Kemenkes via WhatsApp Cloud API setiap pukul 08.00 WIB.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
