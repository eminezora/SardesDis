import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { bookingOpen } from "@/lib/booking-status";
import { readPending } from "@/server/google-pending";
import { AuthShell } from "@/components/AuthShell";
import { GoogleCompleteForm } from "@/components/account/GoogleCompleteForm";

export const metadata: Metadata = { title: "Kaydı tamamla", robots: { index: false } };

export default async function GoogleCompletePage() {
  if (!bookingOpen) notFound();
  const pending = await readPending();
  if (!pending) redirect("/giris?google=sure");
  return (
    <AuthShell
      eyebrow="Google ile kayıt"
      title="Kaydınızı tamamlayın"
      intro={
        <p>
          Google hesabınız ({pending.email}) doğrulandı. Randevu alabilmeniz için cep
          telefonunuzu ekleyin ve aydınlatma metnini onaylayın.
        </p>
      }
    >
      <GoogleCompleteForm firstName={pending.given_name} lastName={pending.family_name} />
    </AuthShell>
  );
}
