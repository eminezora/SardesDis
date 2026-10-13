import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legal } from "@/config/site";
import { previewBooking } from "@/lib/booking-status";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/forms";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

export default function KvkkPage() {
  if (legal.kvkkText.length === 0) {
    if (!previewBooking) notFound();
    return (
      <AuthShell eyebrow="Kişisel veriler" title="KVKK Aydınlatma Metni">
        <Alert tone="info">
          Geliştirme önizlemesi: aydınlatma metni henüz girilmedi. Hukuki
          danışmanlıkla hazırlanan metni <code>src/config/site.ts</code> içindeki{" "}
          <code>legal.kvkkText</code> alanına ekleyin. Metin girilmeden online
          randevu yayında açılmaz.
        </Alert>
      </AuthShell>
    );
  }
  return (
    <AuthShell eyebrow="Kişisel veriler" title="KVKK Aydınlatma Metni" wide>
      <div className="max-w-3xl space-y-5 text-ink/85">
        {legal.dataController && (
          <p>
            <strong className="font-medium">Veri sorumlusu:</strong> {legal.dataController}
          </p>
        )}
        {legal.kvkkText.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </AuthShell>
  );
}
