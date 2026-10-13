import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { bookingOpen } from "@/lib/booking-status";
import { getCurrentUser, homeFor } from "@/server/auth";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/account/RegisterForm";
import { GoogleButton } from "@/components/account/GoogleButton";
import { googleEnabled } from "@/server/google";

export const metadata: Metadata = { title: "Kayıt Ol", robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ sonra?: string }>;
}) {
  if (!bookingOpen) notFound();
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  const { sonra } = await searchParams;

  return (
    <AuthShell
      eyebrow="Hesabım"
      title="Kayıt olun"
      intro={
        <p>
          Hesabınızla online randevu talebi oluşturabilir, randevularınızı
          görebilir ve iptal edebilirsiniz. Sağlık bilgilerinizi burada
          paylaşmanız gerekmez; bunları muayenede konuşuruz.
        </p>
      }
    >
      {googleEnabled && (
        <>
          <GoogleButton next={sonra} label="Google ile kayıt ol" />
          <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-stone-deep" />
            veya
            <span className="h-px flex-1 bg-stone-deep" />
          </div>
        </>
      )}
      <RegisterForm next={sonra} />
      <p className="mt-10 border-t border-stone-deep pt-8 text-[0.9375rem] text-muted">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-medium text-forest underline decoration-gold underline-offset-4">
          Giriş yapın
        </Link>
      </p>
    </AuthShell>
  );
}
