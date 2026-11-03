import { env } from "@/lib/env";

export function register() {
  // Hanya runtime Node.js yang memegang service role; edge (middleware) memakai envSupabase().
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  env();
}
