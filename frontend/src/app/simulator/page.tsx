'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchDischarges } from '@/lib/api';
import { DischargeListItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SendHorizontal,
  Phone,
  CheckCheck,
  ExternalLink,
  AlertOctagon,
  Clock,
  ShieldCheck,
  UserCheck,
  Info,
} from 'lucide-react';

export default function WhatsAppSimulatorPage() {
  const [discharges, setDischarges] = useState<DischargeListItem[]>([]);
  const [selectedDischarge, setSelectedDischarge] = useState<DischargeListItem | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<
    'WA-ASSIGN-01' | 'WA-REMIND-24H' | 'WA-ALERT-48H' | 'WA-EDU-PASIEN' | 'WA-EMERGENCY'
  >('WA-ASSIGN-01');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchDischarges();
        setDischarges(res.data);
        if (res.data.length > 0) {
          setSelectedDischarge(res.data[0]);
        }
      } catch (err) {
        // Fallback demo data
      }
    }
    loadData();
  }, []);

  const d = selectedDischarge || {
    id: 'demo-1',
    nama_ibu: 'Ny. Siti Aisyah',
    nik: '3578015501980001',
    alamat_lengkap: 'Jl. Margorukun Gang 2 No. 14, Kel. Gundih',
    no_whatsapp: '+6281234567890',
    kelurahan: 'Gundih',
    puskesmas: 'Puskesmas Gundih',
    rs_asal: 'RSUD Dr. Soetomo',
    diagnosis_rs: 'Post partum normal hari ke-2',
    jadwal_kunjungan_ulang: '2026-11-04',
    faskes_tujuan: 'PUSKESMAS',
    waktu_krs: '2026-10-29T08:00:00Z',
    deadline_sla: '2026-10-31T08:00:00Z',
    sisa_jam_sla: 48,
    status_kunjungan: 'PENDING',
    status_kesehatan: 'SEHAT',
    is_emergency: false,
    token_kunjungan: 'token_demo_01',
    url_visit: '/visit/token_siti_aisyah_01',
  };

  const urlVisit = d.url_visit || `/visit/${d.token_kunjungan}`;

  // Teks Template PRD Section 6.2
  const templates = {
    'WA-ASSIGN-01': {
      title: 'WA-ASSIGN-01: Penugasan Kunjungan Bidan',
      recipient: `Bidan Kelurahan & Kepala ${d.puskesmas}`,
      sender: 'SIM-NIFAS Surabaya Gateway (Resmi Dinkes)',
      priority: 'Tinggi (High)',
      trigger: 'Data KRS Pasien Berhasil Disimpan di RS',
      body: `[NOTIFIKASI MONITORING IBU NIFAS - KOTA SURABAYA]

Yth. Bidan Kelurahan & Kepala ${d.puskesmas},

Terdapat pasien ibu nifas baru yang dipulangkan dari ${d.rs_asal} dan memerlukan kunjungan rumah:

- Nama Ibu: ${d.nama_ibu}
- NIK: ${d.nik}
- Alamat: ${d.alamat_lengkap}
- No. WhatsApp: ${d.no_whatsapp}
- Diagnosis Sebelum Pulang: ${d.diagnosis_rs}
- Rekomendasi di Rumah: Jaga higienitas luka jahitan, konsumsi tablet Fe rutin

BATAS WAKTU KUNJUNGAN: Maksimal 2x24 Jam (Sebelum ${new Date(d.deadline_sla).toLocaleString('id-ID')} WIB)
Jadwal Kunjungan Ulang: ${d.jadwal_kunjungan_ulang} di ${d.faskes_tujuan}

Segera lakukan kunjungan rumah dan laporkan hasilnya melalui tautan resmi:
${urlVisit}`,
      hasLink: true,
    },
    'WA-REMIND-24H': {
      title: 'WA-REMIND-24H: Pengingat Sisa Waktu 24 Jam',
      recipient: `Bidan Kelurahan ${d.kelurahan}`,
      sender: 'SIM-NIFAS Timer Engine',
      priority: 'Normal',
      trigger: 'T0 + 24 Jam & Belum Dilakukan Kunjungan',
      body: `[PENGINGAT KUNJUNGAN NIFAS - SISA WAKTU 24 JAM]

Yth. Bidan Kelurahan ${d.kelurahan},

Mengingatkan kembali tugas kunjungan rumah untuk pasien:
- Nama Ibu: ${d.nama_ibu}
- Alamat: ${d.alamat_lengkap}

Batas waktu SLA kunjungan tersisa 24 JAM (Deadline: ${new Date(d.deadline_sla).toLocaleString('id-ID')} WIB).
Mohon segera lakukan pemeriksaan fisik lapangan dan isi laporan:
${urlVisit}`,
      hasLink: true,
    },
    'WA-ALERT-48H': {
      title: 'WA-ALERT-48H: Eskalasi Keterlambatan SLA',
      recipient: `Kepala ${d.puskesmas}`,
      sender: 'SIM-NIFAS Supervisor Escalation',
      priority: 'Tinggi (High Priority)',
      trigger: 'T0 + 48 Jam & Laporan Belum Masuk',
      body: `[ESKALASI KETERLAMBATAN KUNJUNGAN RUMAH]

Yth. Kepala ${d.puskesmas},

Sistem mendeteksi bahwa pasien ibu nifas berikut telah MELEWATI BATAS WAKTU SLA 48 JAM dan belum dilaporkan telah dikunjungi:

- Nama Ibu: ${d.nama_ibu}
- Kelurahan: ${d.kelurahan}
- Waktu KRS: ${new Date(d.waktu_krs).toLocaleString('id-ID')} WIB
- Status Kunjungan: NOT_VISITED (Terlambat)

Dimohon untuk melakukan konfirmasi kepada Bidan Kelurahan terkait guna memastikan keselamatan ibu dan bayi.`,
      hasLink: false,
    },
    'WA-EDU-PASIEN': {
      title: 'WA-EDU-PASIEN: Pesan Edukasi & Pengingat Pasien',
      recipient: `Ibu Nifas (${d.nama_ibu})`,
      sender: 'Layanan Kesehatan KIA Surabaya',
      priority: 'Normal',
      trigger: 'Saat Pasien Resmi KRS dari Rumah Sakit',
      body: `Halo Ibu ${d.nama_ibu},

Salam hangat dari Tim Layanan Kesehatan Ibu dan Anak Kota Surabaya. Kami siap mendampingi masa pemulihan Ibu pasca-melahirkan.

Jangan lupa untuk melakukan Kunjungan Ulang (Kontrol Nifas) ke ${d.faskes_tujuan} pada:
Tanggal: ${d.jadwal_kunjungan_ulang}

Segera hubungi bidan atau faskes terdekat jika Ibu merasakan salah satu TANDA BAHAYA NIFAS berikut:
1. Demam > 38°C
2. Perdarahan banyak dari jalan lahir
3. Nyeri hebat pada bagian perut
4. Bau tidak sedap atau cairan nanah pada luka jahitan
5. Pusing berat, muntah terus-menerus, atau lemas ekstrem

Kontak Bidan Kelurahan Pendamping Anda:
Puskesmas ${d.puskesmas} (${d.no_whatsapp})

Bersama Kita Pastikan Ibu dan Bayi Sehat, Aman, dan Sejahtera.`,
      hasLink: false,
    },
    'WA-EMERGENCY': {
      title: 'WA-EMERGENCY: Peringatan Bahaya Nifas (Red Alert)',
      recipient: `Bidan Kelurahan & Kepala ${d.puskesmas}`,
      sender: 'Sistem Kedaruratan Maternal Dinkes',
      priority: 'DARURAT (Urgent)',
      trigger: 'Laporan Kunjungan Lapangan Mengindikasikan Bahaya',
      body: `[PERINGATAN BAHAYA NIFAS - SEGERA TINDAK LANJUT]

Ditemukan indikasi tanda bahaya maternal pada pasien nifas binaan Anda:
- Nama Ibu: ${d.nama_ibu}
- Alamat: ${d.alamat_lengkap}
- No. WhatsApp: ${d.no_whatsapp}
- Jenis Masalah: Demam 38.6°C, Perdarahan aktif abnormal, Nyeri perut hebat
    - Waktu Laporan: 29-10-2026 10:15 WIB

Instruksi: Bidan Kelurahan bersama Tim Puskesmas dimohon segera melakukan pemeriksaan fisik langsung atau memfasilitasi rujukan cepat ke IGD Faskes/RS terdekat!`,
      hasLink: false,
    },
  };

  const currentTpl = templates[activeTemplate];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SendHorizontal className="size-6 text-teal-600" />
            Simulator &amp; Audit Log WhatsApp Gateway
          </h1>
          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-800 border-teal-200">
            PRD Section 6
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Simulasi 5 kontrak template pesan otomatis WhatsApp Meta Cloud API dan pengetesan tautan direct link kunjungan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Pilihan Pasien & Template */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3.5 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Pilih Sampel Pasien:
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2">
              <div className="space-y-1">
                {discharges.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedDischarge(item)}
                    className={`w-full text-left p-2 rounded-md border text-xs transition-colors flex justify-between items-center ${
                      d.id === item.id
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                        : 'border-muted hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <strong className="text-foreground block">{item.nama_ibu}</strong>
                      <span className="text-[11px] text-muted-foreground">{item.kelurahan}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {item.status_kunjungan}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tab Template */}
          <Card>
            <CardHeader className="p-3.5 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Pilih Template Pesan PRD:
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-1.5">
              {(Object.keys(templates) as (keyof typeof templates)[]).map((key) => {
                const isSelected = activeTemplate === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTemplate(key)}
                    className={`w-full text-left p-2.5 rounded-md border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-muted hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{key}</span>
                      {key === 'WA-EMERGENCY' && (
                        <span className="size-2 rounded-full bg-red-400 animate-ping inline-block" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        isSelected ? 'text-teal-100' : 'text-muted-foreground'
                      }`}
                    >
                      {templates[key].title.split(':')[1]}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Tampilan Interaktif Mockup WhatsApp */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata Kartu */}
          <div className="rounded-md bg-muted/40 border p-3 text-xs flex flex-wrap justify-between gap-2">
            <div>
              <span className="text-muted-foreground">Penerima: </span>
              <strong className="text-foreground">{currentTpl.recipient}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Trigger: </span>
              <span className="text-foreground">{currentTpl.trigger}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Prioritas: </span>
              <Badge
                className={
                  currentTpl.priority.includes('DARURAT')
                    ? 'bg-red-600 text-white text-[10px]'
                    : currentTpl.priority.includes('Tinggi')
                    ? 'bg-amber-600 text-white text-[10px]'
                    : 'bg-emerald-600 text-white text-[10px]'
                }
              >
                {currentTpl.priority}
              </Badge>
            </div>
          </div>

          {/* Mockup WhatsApp Device Preview */}
          <div className="rounded-xl border shadow-md bg-slate-100 dark:bg-slate-900 overflow-hidden max-w-lg mx-auto">
            {/* WhatsApp Header Bar */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs">
                  SN
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">SIM-NIFAS Kota Surabaya</h4>
                  <span className="text-[10px] text-emerald-200">Akun Resmi Dinas Kesehatan</span>
                </div>
              </div>
              <Badge variant="outline" className="border-white/30 text-white text-[10px]">
                Meta Verified
              </Badge>
            </div>

            {/* Chat Bubble Area */}
            <div className="p-4 space-y-3 min-h-[360px] flex flex-col justify-end bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3.5 shadow-sm max-w-[92%] self-start space-y-2 border">
                <p className="text-xs whitespace-pre-line text-foreground font-sans leading-relaxed">
                  {currentTpl.body}
                </p>

                {/* Direct Action Link Button jika ada */}
                {currentTpl.hasLink && (
                  <div className="pt-2 border-t mt-2">
                    <Link href={urlVisit} className="block">
                      <Button
                        size="sm"
                        className="w-full bg-[#128c7e] hover:bg-[#075e54] text-white text-xs gap-1.5 h-8 font-semibold shadow-xs"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Buka Formulir Kunjungan Bidan</span>
                      </Button>
                    </Link>
                    <span className="text-[10px] text-muted-foreground block text-center mt-1">
                      (Bidan mengklik tombol ini langsung dari chat WhatsApp)
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground pt-1">
                  <span>08:30 WIB</span>
                  <CheckCheck className="size-3.5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
