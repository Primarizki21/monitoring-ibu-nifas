// Pasang/replace job pg_cron yang memanggil /api/cron tiap menit.
// Aman dijalankan ulang: secret di Vault di-upsert, job lama di-unschedule dulu.
// Jalankan dari web/: node --env-file=.env.local scripts/pasang-jadwal-cron.mjs
//
// DATABASE_URL opsional. Tanpa itu, query dijalankan terhadap Supabase lokal
// (--local). Untuk hosted, isi DATABASE_URL dengan connection string PostgreSQL
// (percent-encoded) di .env.local atau di lingkungan shell.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const jalankan = promisify(execFile);
const webDir = fileURLToPath(new URL("..", import.meta.url));

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const secret = process.env.CRON_SECRET;
if (!appUrl) throw new Error("Isi NEXT_PUBLIC_APP_URL di .env.local");
if (!secret) throw new Error("Isi CRON_SECRET di .env.local");

const urlApi = `${appUrl.replace(/\/+$/, "")}/api/cron`;
const literal = (nilai) => `'${String(nilai).replace(/'/g, "''")}'`;
const redaksi = (teks) => String(teks).split(secret).join("[REDACTED]");

const sql = `
do $nifas$
declare
  v_id uuid;
begin
  select id into v_id from vault.decrypted_secrets where name = 'cron_secret';
  if v_id is null then
    perform vault.create_secret(${literal(secret)}, 'cron_secret');
  else
    perform vault.update_secret(v_id, ${literal(secret)});
  end if;
end $nifas$;

select cron.unschedule(jobid) from cron.job where jobname = 'sim-nifas-tiap-menit';

select cron.schedule(
  'sim-nifas-tiap-menit',
  '* * * * *',
  $job$select net.http_get(
    url := ${literal(urlApi)},
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  )$job$
);
`;

const dbUrl = process.env.DATABASE_URL;
const argumen = ["db", "query", ...(dbUrl ? ["--db-url", dbUrl] : ["--local"]), "-f"];
const direktori = await mkdtemp(join(tmpdir(), "nifas-cron-"));
const berkas = join(direktori, "pasang.sql");

try {
  await writeFile(berkas, sql, { mode: 0o600 });
  await chmod(berkas, 0o600);
  await jalankan(join(webDir, "node_modules/.bin/supabase"), [...argumen, berkas], { cwd: webDir });
  console.log(`+ cron_secret disimpan di Vault; job sim-nifas-tiap-menit dipasang untuk ${urlApi}`);
} catch (err) {
  const detail = redaksi(err.stderr || err.stdout || err.message);
  throw new Error(`Gagal memasang jadwal cron:\n${detail}`);
} finally {
  await rm(direktori, { recursive: true, force: true });
}
