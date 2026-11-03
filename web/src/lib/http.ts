import { NextResponse, type NextRequest } from "next/server";

export type KodeGalat =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "gone"
  | "validation_error"
  | "internal_error";

// Amplop galat tunggal: `code`/`message` dipertahankan di level atas untuk klien lama,
// `error` memberi bentuk standar { error: { code, message } }.
export function galat(status: number, code: KodeGalat, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, code, message, error: { code, message }, ...extra },
    { status, headers: { "cache-control": "no-store" } },
  );
}

// Mutasi yang memakai cookie sesi harus berasal dari origin aplikasi sendiri (CSRF).
// Klien Bearer (server-to-server) tidak memakai cookie sehingga dikecualikan.
export function asalSah(req: NextRequest): boolean {
  if (req.headers.get("authorization")?.startsWith("Bearer ")) return true;
  const asal = req.headers.get("origin");
  return !asal || asal === req.nextUrl.origin;
}
