import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Font di-vendor lokal (woff2 latin, variable). Build tidak lagi bergantung
// pada koneksi ke fonts.googleapis.com — penyebab build gagal acak di CI/Docker.
const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-jakarta",
  weight: "400 700",
  display: "swap",
});

const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  variable: "--font-bricolage",
  weight: "500 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIM-NIFAS Surabaya",
  description: "Sistem Informasi Monitoring Discharge Planning Ibu Nifas Kota Surabaya",
};

export const viewport: Viewport = {
  themeColor: "#0f4c5c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${bricolage.variable}`}>{children}</body>
    </html>
  );
}
