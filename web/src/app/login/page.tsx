import { redirect } from "next/navigation";
import { CircleAlert, LogIn } from "lucide-react";
import { HeroAdegan } from "@/components/landing/hero";
import { Logo } from "@/components/aset/logo";
import { halamanAwal, type Profil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function masuk(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  const next = String(formData.get("next") || "");
  // Salah kata sandi itu wajar; selain itu (jaringan, konfigurasi) perlu terlihat di log server.
  if (error && error.code !== "invalid_credentials") console.error("login gagal:", error.status, error.code, error.message);
  if (error) redirect(`/login?gagal=1&next=${encodeURIComponent(next)}`);
  if (next.startsWith("/") && next !== "/") redirect(next);
  // Tanpa tujuan khusus: arahkan ke halaman kerja sesuai peran, bukan kembali ke beranda.
  const { data: profil } = await supabase.rpc("profil_saya").maybeSingle<Profil>();
  redirect(profil?.id ? halamanAwal(profil.role) : "/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ gagal?: string; next?: string }>;
}) {
  const { gagal, next } = await searchParams;

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
      <section className="order-2 lg:order-1">
        <HeroAdegan />
        <h1 className="mx-auto mt-8 max-w-[18ch] text-balance text-center font-display text-3xl font-semibold leading-[1.1] tracking-tight text-selat-tua sm:text-4xl lg:mx-0 lg:text-left lg:text-5xl">
          Setiap ibu yang pulang dari rumah sakit, dikunjungi dalam 48 jam.
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-center text-tinta-redup lg:mx-0 lg:text-left">
          Rumah sakit, Puskesmas, dan bidan kelurahan di Surabaya memantau ibu nifas dari satu tempat, dari hari kepulangan sampai kontrol ulang.
        </p>
      </section>

      <section className="order-1 lg:order-2">
        <form action={masuk} className="kaca mx-auto w-full max-w-md space-y-5 rounded-[2rem] p-6 sm:p-8">
          <Logo />
          <div>
            <h2 className="font-display text-2xl font-semibold text-tinta">Masuk</h2>
            <p className="text-sm text-tinta-redup">Gunakan akun yang diberikan Dinas Kesehatan.</p>
          </div>
          {gagal && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50/90 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Email atau kata sandi tidak cocok. Periksa lagi, atau hubungi admin Dinkes untuk mengatur ulang.
            </p>
          )}
          <input type="hidden" name="next" value={next ?? ""} />
          <label className="block text-sm font-semibold">
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="nama@puskesmas.go.id" className="input mt-1.5" />
          </label>
          <label className="block text-sm font-semibold">
            Kata sandi
            <input name="password" type="password" required autoComplete="current-password" className="input mt-1.5" />
          </label>
          <button className="btn-primary w-full">
            <LogIn className="size-4.5" aria-hidden="true" />
            Masuk
          </button>
          <p className="text-center text-xs text-tinta-redup">Bidan kelurahan tidak perlu masuk untuk mengisi laporan kunjungan: buka tautan dari WhatsApp.</p>
        </form>
      </section>
    </main>
  );
}
