import type { Profil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export type AksiAudit = "tambah" | "ubah" | "aktifkan" | "nonaktifkan" | "reset_sandi";

// Menulis audit tindakan admin. Gagal menulis tidak membatalkan aksi utama yang sudah tersimpan;
// kegagalan hanya dicatat di log server (tanpa data pasien).
export async function catatAudit(
  aktor: Profil,
  aksi: AksiAudit,
  targetTabel: string,
  targetId: string | null,
  detail: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  const { error } = await admin.from("log_audit_admin").insert({
    aktor_id: aktor.id,
    aktor_nama: aktor.nama_lengkap,
    aktor_role: aktor.role,
    aksi,
    target_tabel: targetTabel,
    target_id: targetId,
    detail,
  });
  if (error) console.error("Gagal mencatat audit admin:", error.message);
}
