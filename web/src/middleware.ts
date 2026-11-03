import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envSupabase } from "@/lib/env";

// Halaman yang wajib login. /visit/[token] dan /api sengaja tidak dicakup.
const HALAMAN_TERLINDUNG = ["/krs", "/dashboard"];

// CSP dengan nonce: Next.js menyisipkan nonce ke skrip yang dirender dari header request `x-nonce`.
function susunCsp(nonce: string) {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Gaya inline dibutuhkan library animasi (motion) dan transform Tailwind.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = susunCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const { url, anonKey } = envSupabase();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims memverifikasi JWT (ES256) secara lokal: tanpa round-trip ke server Auth di setiap request.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const path = request.nextUrl.pathname;
  if (!user && HALAMAN_TERLINDUNG.some((p) => path.startsWith(p))) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    const jawaban = NextResponse.redirect(redirect);
    jawaban.headers.set("content-security-policy", csp);
    return jawaban;
  }

  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
