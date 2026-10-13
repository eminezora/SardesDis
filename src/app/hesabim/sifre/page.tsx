import type { Metadata } from "next";
import Link from "next/link";
import { ACCOUNT_HOME, requireUser } from "@/server/auth";
import { AuthShell } from "@/components/AuthShell";
import { PasswordForm } from "@/components/account/PasswordForm";

export const metadata: Metadata = { title: "Şifre", robots: { index: false } };

export default async function PasswordPage() {
  const user = await requireUser({ passwordPage: true, next: "/hesabim/sifre" });
  const forced = user.mustChangePassword;
  return (
    <AuthShell
      eyebrow="Hesabım"
      title={forced ? "Yeni şifrenizi belirleyin" : "Şifre değiştir"}
      intro={forced ? <p>Geçici şifreyle giriş yaptınız. Devam etmek için kendinize yeni bir şifre belirleyin.</p> : undefined}
    >
      <PasswordForm forced={forced} />
      {!forced && (
        <p className="mt-10 border-t border-stone-deep pt-8 text-[0.9375rem]">
          <Link href={ACCOUNT_HOME} className="text-forest underline decoration-gold underline-offset-4">
            Geri dön
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
