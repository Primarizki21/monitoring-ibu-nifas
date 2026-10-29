import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "SUPERADMIN_DINKES" | "KEPALA_PUSKESMAS" | "BIDAN_KELURAHAN" | "BIDAN_RS";

export type Profil = {
  id: string;
  nama_lengkap: string;
  role: Role;
  puskesmas_id: string | null;
  rumah_sakit_id: string | null;
  kelurahan_id: string | null;
};

// Profil pengguna login, atau redirect ke /login.
export async function wajibLogin(): Promise<Profil> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("profil_saya").maybeSingle<Profil>();
  if (!data?.id) redirect("/login");
  return data;
}

export function halamanAwal(role: Role) {
  return role === "BIDAN_RS" ? "/krs" : "/dashboard";
}
