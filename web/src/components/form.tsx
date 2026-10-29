import type { LucideIcon } from "lucide-react";

export function Bagian({ judul, ikon: Ikon, children }: { judul: string; ikon?: LucideIcon; children: React.ReactNode }) {
  return (
    <fieldset className="kaca space-y-4 rounded-[var(--radius-kaca)] p-5 sm:p-6">
      <legend className="float-left mb-2 flex w-full items-center gap-2.5 font-display text-lg font-semibold text-selat">
        {Ikon && (
          <span className="grid size-8 place-items-center rounded-lg bg-selat/10 text-selat">
            <Ikon className="size-4.5" aria-hidden="true" />
          </span>
        )}
        {judul}
      </legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-tinta">
      {label}
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1.5 block font-medium text-red-700">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block font-normal text-tinta-redup">{hint}</span>
      )}
    </label>
  );
}
