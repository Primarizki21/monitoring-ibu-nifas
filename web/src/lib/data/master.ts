import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export type MasterFaskes = {
  puskesmas: { id: string; nama_puskesmas: string }[];
  kelurahan: { id: string; nama_kelurahan: string; puskesmas_id: string; kecamatan: string }[];
  rs: { id: string; nama_rs: string }[];
};

// Data master RS, Puskesmas, dan Kelurahan di Surabaya bersifat statis.
// Cache selama 24 jam untuk menghindari 3 query berulang ke Supabase di setiap request halaman.
export const ambilMasterFaskes = unstable_cache(
  async (): Promise<MasterFaskes> => {
    const db = createAdminClient();
    const [pkm, kel, rs] = await Promise.all([
      db.from("m_puskesmas").select("id, nama_puskesmas").order("nama_puskesmas"),
      db.from("m_kelurahan").select("id, nama_kelurahan, puskesmas_id, kecamatan").order("nama_kelurahan"),
      db.from("m_rumah_sakit").select("id, nama_rs"),
    ]);

    return {
      puskesmas: pkm.data ?? [],
      kelurahan: kel.data ?? [],
      rs: rs.data ?? [],
    };
  },
  ["master-faskes-surabaya"],
  { revalidate: 86400, tags: ["master_data"] },
);
