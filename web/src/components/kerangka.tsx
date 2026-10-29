// Kerangka halaman saat data dimuat: navigasi terasa instan walau Supabase butuh ~0,4 dtk.
export function Kerangka({ blok = [24, 72, 40] }: { blok?: number[] }) {
  return (
    <div aria-busy="true" aria-label="Memuat halaman">
      <div className="px-3 pt-3 sm:px-4">
        <div className="kaca mx-auto h-[3.75rem] max-w-7xl rounded-2xl" />
      </div>
      <div className="mx-auto max-w-7xl space-y-4 px-3 pt-6 sm:px-4">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-white/50" />
        {blok.map((h, i) => (
          <div key={i} className="kaca animate-pulse rounded-[var(--radius-kaca)]" style={{ height: `${h * 4}px` }} />
        ))}
      </div>
    </div>
  );
}
