import Link from "next/link";
import { LogoutButton } from "@/components/account/LogoutButton";

export function StaffNav({ active, name }: { active: "randevular" | "hastalar"; name: string }) {
  const item = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`border-b pb-1 text-[0.9375rem] ${on ? "border-gold text-forest" : "border-transparent text-ink/80 hover:text-forest"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-col gap-5 border-b border-stone-deep pb-6 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Yönetim" className="flex gap-7">
        {item("/yonetim", "Randevular", active === "randevular")}
        {item("/yonetim/hastalar", "Hastalar", active === "hastalar")}
      </nav>
      <div className="flex items-center gap-6 text-sm text-muted">
        <span>{name}</span>
        <Link href="/hesabim/sifre" className="underline decoration-stone-deep underline-offset-4 hover:text-forest">
          Şifre
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
