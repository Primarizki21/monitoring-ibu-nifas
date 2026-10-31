"use client";

import dynamic from "next/dynamic";

export const GrafikTren = dynamic(() => import("./grafik").then((m) => m.GrafikTren), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-white/40" />,
});

export const GrafikStatus = dynamic(() => import("./grafik").then((m) => m.GrafikStatus), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse rounded-2xl bg-white/40" />,
});
