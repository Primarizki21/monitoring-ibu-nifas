import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardPlus, LayoutDashboard, LogOut } from "lucide-react";
import { Logo } from "@/components/aset/logo";
import type { Profil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const NAMA_PERAN: Record<Profil["role"], string> = {
  SUPERADMIN_DINKES: "Dinkes Kota Surabaya",
  KEPALA_PUSKESMAS: "Kepala Puskesmas",
  BIDAN_KELURAHAN: "Bidan Kelurahan",
  BIDAN_RS: "Bidan RS",
};

async function keluar() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function inisial(nama: string) {
  return nama
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase();
}

export function Header({ profil, aktif }: { profil: Profil; aktif: "krs" | "dashboard" }) {
  const menu = [
    ...(profil.role === "BIDAN_RS" ? [{ href: "/krs", label: "Pulangkan pasien", ikon: ClipboardPlus, kunci: "krs" }] : []),
    { href: "/dashboard", label: "Dashboard", ikon: LayoutDashboard, kunci: "dashboard" },
  ];

  return (
    <header className="sticky top-0 z-20 px-3 pt-3 sm:px-4">
      <div className="kaca mx-auto flex max-w-7xl items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-6 sm:px-4">
        <Link href="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selat/30">
          <Logo />
        </Link>
        <nav className="flex gap-1">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              aria-current={aktif === m.kunci ? "page" : undefined}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-tinta-redup transition-colors hover:bg-white/60 hover:text-selat aria-[current=page]:bg-selat aria-[current=page]:text-white"
            >
              <m.ikon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{m.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-right leading-tight md:block">
            <span className="block text-sm font-semibold">{profil.nama_lengkap}</span>
            <span className="block text-xs text-tinta-redup">{NAMA_PERAN[profil.role]}</span>
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blush to-kunyit/70 text-xs font-bold text-selat-tua ring-2 ring-white" aria-hidden="true">
            {inisial(profil.nama_lengkap)}
          </span>
          <form action={keluar}>
            <button className="grid size-9 place-items-center rounded-xl text-tinta-redup transition-colors hover:bg-white/70 hover:text-selat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selat/30" aria-label="Keluar" title="Keluar">
              <LogOut className="size-4.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
