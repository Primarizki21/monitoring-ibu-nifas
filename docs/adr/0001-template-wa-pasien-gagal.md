# ADR 0001: Menambah template WA-PASIEN-GAGAL sebagai template WhatsApp keenam

## Status

Accepted

## Konteks

PRD §6.1 menetapkan lima template WhatsApp: `WA-ASSIGN-01`, `WA-REMIND-24H`, `WA-ALERT-48H`, `WA-EDU-PASIEN`, dan `WA-EMERGENCY`. PRD §7.3 mensyaratkan pemberitahuan otomatis kepada Bidan Kelurahan ketika nomor WhatsApp pasien tidak aktif atau pesan gagal terkirim. Kelima template tersebut tidak ada yang mengakomodasi pemberitahuan ini.

## Keputusan

Menambahkan `template_id` `WA-PASIEN-GAGAL` sebagai template keenam di luar matriks PRD §6.1. Pesan dibentuk oleh `waNomorPasienGagal` di `web/src/lib/wa/template.ts` dan diantrukan oleh worker WA dengan template_id tersebut. Penerimanya Bidan Kelurahan, sesuai PRD §7.3.

## Alternatif yang dipertimbangkan

1. Memakai ulang `WA-ASSIGN-01` atau `WA-REMIND-24H` dengan menyisipkan keterangan gagal. Ditolak karena mengubah makna template yang sudah terikat pada pemicu lain dan mengaburkan audit pengiriman.
2. Hanya mencatat status `FAILED` tanpa notifikasi. Ditolak karena PRD §7.3 mensyaratkan pemberitahuan aktif kepada Bidan Kelurahan.
3. Memakai `WA-EMERGENCY` untuk kasus ini. Ditolak karena kegagalan nomor WA bukan kondisi darurat klinis dan akan memicu eskalasi yang keliru.

## Konsekuensi

- PRD §7.3 terpenuhi dan bidan dapat memeriksa nomor pasien saat kunjungan rumah.
- Matriks PRD §6.1 kini tertinggal satu template dari implementasi. Penyimpangan ini disengaja dan perlu dicatat agar tidak dianggap drift saat audit.
- Pesan mengikuti antrean, retry, dan audit WA yang sudah ada, tanpa jalur pengiriman baru.
