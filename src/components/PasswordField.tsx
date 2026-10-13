"use client";

import { useState } from "react";
import { passwordRules } from "@/lib/password-rules";

/** Şifre alanı + canlı kural listesi + göster/gizle */
export function PasswordField({
  label,
  name,
  error,
  autoComplete = "new-password",
  showRules = true,
}: {
  label: string;
  name: string;
  error?: string;
  autoComplete?: string;
  showRules?: boolean;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const id = `f-${name}`;
  const rulesId = `${id}-rules`;
  const describedBy = [showRules && rulesId, error && `${id}-err`].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block min-h-12 w-full rounded-[2px] border bg-paper py-2 pl-4 pr-20 text-base text-ink outline-none transition-colors focus:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
            error ? "border-[#9b3b2f]" : "border-stone-deep"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 px-4 text-sm text-muted hover:text-ink"
        >
          {visible ? "Gizle" : "Göster"}
        </button>
      </div>

      {showRules && (
        <ul id={rulesId} className="mt-3 grid gap-1.5 text-sm" aria-label="Şifre kuralları">
          {passwordRules.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} className={`flex items-start gap-2 ${ok ? "text-ink" : "text-muted"}`}>
                <span
                  aria-hidden="true"
                  className={`mt-[0.4rem] inline-block h-2 w-2 shrink-0 rounded-full border ${
                    ok ? "border-forest bg-forest" : "border-muted/60"
                  }`}
                />
                <span>
                  {r.label}
                  <span className="sr-only">{ok ? " — karşılandı" : " — henüz karşılanmadı"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-[#9b3b2f]">
          {error}
        </p>
      )}
    </div>
  );
}
