"use client";

// Batas galat akar: hanya aktif bila layout utama sendiri gagal dirender.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Aplikasi gagal dimuat</h1>
        <p style={{ color: "#475569", marginTop: "0.75rem" }}>Data tidak berubah. Muat ulang halaman untuk mencoba lagi.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: "1.5rem", padding: "0.65rem 1.25rem", borderRadius: "0.75rem", border: 0, background: "#0f4c5c", color: "#fff", fontWeight: 600 }}
        >
          Muat ulang
        </button>
        {error.digest && <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "1rem" }}>Kode: {error.digest}</p>}
      </body>
    </html>
  );
}
