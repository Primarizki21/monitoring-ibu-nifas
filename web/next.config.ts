import type { NextConfig } from "next";
import path from "node:path";

// Header statis; Content-Security-Policy dipasang per-request di src/middleware.ts (nonce).
const headerKeamanan = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: headerKeamanan }];
  },
};

export default nextConfig;
