"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Siren } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AlertAktif } from "@/lib/data/dashboard";
import { formatWaktu } from "@/lib/wa/template";

// Floating Red Alert Banner (PRD 3, Tahap 5). Berlangganan Supabase Realtime:
// alert baru atau status discharge berubah -> data dashboard dimuat ulang.
export function RedAlert({ alerts }: { alerts: AlertAktif[] }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const kanal = supabase
      .channel("dashboard-nifas")
      .on("postgres_changes", { event: "*", schema: "public", table: "tr_emergency_alert" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "tr_discharge" }, () => router.refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [router]);

  if (!alerts.length) return null;

  return (
    <>
    <section
      id="red-alert"
      role="alert"
      className="scroll-mt-28 overflow-hidden rounded-[var(--radius-kaca)] bg-gradient-to-br from-red-600/90 to-rose-700/90 p-5 text-white shadow-[0_24px_48px_-20px_rgb(200_30_58/0.8)] ring-1 ring-white/25 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
          <span className="absolute inset-0 rounded-xl bg-white/25 motion-safe:animate-ping" aria-hidden="true" />
          <Siren className="relative size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight">
            {alerts.length} ibu dengan tanda bahaya perlu ditindaklanjuti
          </h2>
          <p className="text-sm text-white/80">Hubungi bidan kelurahan atau dampingi rujukan ke IGD terdekat.</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {alerts.slice(0, 4).map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-white/12 p-3 ring-1 ring-white/20">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{a.discharge?.nama_ibu}</p>
              <p className="text-sm text-white/85">{a.jenis_masalah}</p>
              <p className="text-xs text-white/70">{formatWaktu(a.waktu_laporan)}</p>
            </div>
            {a.discharge && (
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${a.discharge.no_whatsapp_ibu.replace("+", "")}`}
                  className="grid size-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 hover:bg-white/25"
                  aria-label={`Hubungi ${a.discharge.nama_ibu} lewat WhatsApp`}
                >
                  <Phone className="size-4" aria-hidden="true" />
                </a>
                <Link href={`/dashboard/pasien/${a.discharge.id}`} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Tindak lanjut
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
      {alerts.length > 4 && <p className="mt-2 text-sm text-white/80">dan {alerts.length - 4} ibu lainnya</p>}
    </section>

    {/* Penanda mengambang agar Red Alert tetap terlihat saat menggulir tabel panjang. */}
    <a
      href="#red-alert"
      className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-red-600/90 py-2.5 pl-3 pr-4 text-sm font-semibold text-white shadow-[0_16px_32px_-12px_rgb(200_30_58/0.8)] ring-1 ring-white/30 backdrop-blur-xl hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
    >
      <Siren className="size-4.5" aria-hidden="true" />
      {alerts.length} tanda bahaya
    </a>
    </>
  );
}
