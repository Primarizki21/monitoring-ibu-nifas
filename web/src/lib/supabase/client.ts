import { createBrowserClient } from "@supabase/ssr";

// Klien browser — hanya kunci publik (anon), aman diekspos ke bundel.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi");
  return createBrowserClient(url, anonKey);
}
