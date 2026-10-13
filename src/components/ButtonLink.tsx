import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "light" | "outline-light";

const styles: Record<Variant, string> = {
  primary:
    "bg-forest text-paper border-forest hover:bg-forest-deep hover:border-forest-deep",
  outline:
    "border-ink/25 text-ink hover:border-forest hover:text-forest bg-transparent",
  light: "bg-paper text-forest border-paper hover:bg-ivory",
  "outline-light":
    "border-paper/40 text-paper hover:border-champagne hover:text-champagne bg-transparent",
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-[2px] border px-7 text-[0.9375rem] font-medium tracking-[0.02em] transition-colors duration-300";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
}) {
  const cls = `${base} ${styles[variant]} ${className}`;
  if (external || /^(tel:|https?:)/.test(href)) {
    return (
      <a
        href={href}
        className={cls}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Etkin olmayan (henüz bilgisi girilmemiş) eylem için görünür ama tıklanamaz buton */
export function DisabledButton({
  children,
  note,
  className = "",
}: {
  children: ReactNode;
  note: string;
  className?: string;
}) {
  return (
    <span
      aria-disabled="true"
      title={note}
      className={`${base} cursor-not-allowed border-dashed border-ink/25 text-muted ${className}`}
    >
      {children}
    </span>
  );
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 10"
      className={`h-2.5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M0 5h19M15 1l4 4-4 4" />
    </svg>
  );
}
