"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function Field({
  label,
  name,
  type = "text",
  error,
  hint,
  defaultValue,
  autoComplete,
  inputMode,
  required = true,
  optionalLabel,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  required?: boolean;
  optionalLabel?: boolean;
}) {
  const id = `f-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink">
        {label}
        {optionalLabel && <span className="text-xs font-normal text-muted">İsteğe bağlı</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block min-h-12 w-full rounded-[2px] border bg-paper px-4 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
          error ? "border-[#9b3b2f]" : "border-stone-deep"
        }`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-[#9b3b2f]">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText = "Gönderiliyor…",
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "outline" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "border-forest bg-forest text-paper hover:bg-forest-deep",
    outline: "border-ink/25 text-ink hover:border-forest hover:text-forest",
    danger: "border-[#9b3b2f]/40 text-[#9b3b2f] hover:border-[#9b3b2f]",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-12 items-center justify-center rounded-[2px] border px-7 text-[0.9375rem] font-medium tracking-[0.02em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-[#9b3b2f]/35 bg-[#9b3b2f]/[0.06] text-[#7d2f25]",
    success: "border-forest/30 bg-forest/[0.06] text-forest",
    info: "border-stone-deep bg-paper text-muted",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`border px-5 py-4 text-[0.9375rem] ${styles}`}>
      {children}
    </div>
  );
}
