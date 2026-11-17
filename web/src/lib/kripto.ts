import type { SupabaseClient } from "@supabase/supabase-js";

// PRD 10: kolom sensitif disimpan terenkripsi. Dekripsi terjadi di server lewat
// RPC SECURITY DEFINER; kunci tidak pernah dikirim ke browser atau klien API.

export async function dekripsiBanyak<T extends string | null>(
  db: SupabaseClient,
  nilai: T[],
): Promise<T[]> {
  const indeks: number[] = [];
  const terenkripsi: string[] = [];
  nilai.forEach((v, i) => {
    if (v !== null) {
      indeks.push(i);
      terenkripsi.push(v);
    }
  });
  if (!terenkripsi.length) return nilai;

  const { data, error } = await db.rpc("dekripsi_nifas_banyak", { p_teks: terenkripsi });
  if (error) throw error;
  if (!data || data.length !== terenkripsi.length) {
    throw new Error("Gagal mendekripsi data pasien");
  }

  const hasil = [...nilai];
  indeks.forEach((posisi, i) => {
    hasil[posisi] = data[i] as T;
  });
  return hasil;
}

export async function dekripsi<T extends string | null>(db: SupabaseClient, nilai: T): Promise<T> {
  return (await dekripsiBanyak(db, [nilai]))[0];
}
