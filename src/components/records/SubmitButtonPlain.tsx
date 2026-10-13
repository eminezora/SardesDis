"use client";

import type { ReactNode } from "react";

/** Sunucu işlemi olmayan (klasik) formlar için gönder butonu */
export function SubmitButtonPlain({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy || undefined}
      className="inline-flex min-h-12 items-center justify-center rounded-[2px] border border-forest bg-forest px-7 text-[0.9375rem] font-medium text-paper transition-colors hover:bg-forest-deep disabled:opacity-60"
    >
      {busy ? "Yükleniyor…" : children}
    </button>
  );
}
