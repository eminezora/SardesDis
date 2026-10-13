import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { contact } from "@/config/site";
import { bookingOpen } from "@/lib/booking-status";
import { ACCOUNT_HOME, getCurrentUser } from "@/server/auth";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/account/LoginForm";
import { GoogleButton } from "@/components/account/GoogleButton";
import { Alert } from "@/components/forms";
import { googleEnabled } from "@/server/google";

const googleErrors: Record<string, string> = {
  iptal: "Google ile giriş iptal edildi.",
  sure: "Google ile giriş süresi doldu. Lütfen tekrar deneyin.",
  hata: "Google ile giriş yapılamadı. Lütfen tekrar deneyin.",
  baska: "Bu e-posta adresi başka bir Google hesabına bağlı.",
  "hesap-yok": "Bu Google hesabıyla eşleşen bir hasta hesabı bulunamadı.",
  kapali: "Hasta hesapları şu anda kullanıma kapalı.",
};

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sonra?: string; google?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(ACCOUNT_HOME);
  const { sonra, google } = await searchParams;

  return (
    <AuthShell
      eyebrow="Hesabım"
      title="Giriş yapın"
      intro={bookingOpen ? <p>Randevu almak ve randevularınızı görmek için hesabınıza giriş yapın.</p> : undefined}
    >
      {google && googleErrors[google] && (
        <div className="mb-6">
          <Alert>{googleErrors[google]}</Alert>
        </div>
      )}
      {googleEnabled && (
        <>
          <GoogleButton next={sonra} />
          <div className="my-8 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-stone-deep" />
            veya
            <span className="h-px flex-1 bg-stone-deep" />
          </div>
        </>
      )}
      <LoginForm next={sonra} />
      <div className="mt-10 space-y-3 border-t border-stone-deep pt-8 text-[0.9375rem] text-muted">
        {bookingOpen && (
          <p>
            Hesabınız yok mu?{" "}
            <Link
              href={sonra ? `/kayit?sonra=${encodeURIComponent(sonra)}` : "/kayit"}
              className="font-medium text-forest underline decoration-gold underline-offset-4"
            >
              Kayıt olun
            </Link>
          </p>
        )}
        <p>
          Şifrenizi unuttuysanız kliniği arayın ({contact.phone.display}); size geçici bir
          şifre iletilir.
        </p>
      </div>
    </AuthShell>
  );
}
