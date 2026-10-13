import type { Metadata } from "next";
import Link from "next/link";
import { contact, doctors } from "@/config/site";
import { cancelAppointment } from "@/actions/appointments";
import { formatMobile } from "@/lib/validation";
import { formatDateLong, istanbulDate } from "@/lib/time";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { canPatientCancel, patientAppointments } from "@/server/appointments";
import { AuthShell } from "@/components/AuthShell";
import { ButtonLink } from "@/components/ButtonLink";
import { Alert, SubmitButton } from "@/components/forms";
import { LogoutButton } from "@/components/account/LogoutButton";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

const doctorName = (slug: string | null) =>
  slug ? `Dt. ${doctors.find((d) => d.slug === slug)?.name ?? slug}` : "Hekim klinik tarafından belirlenecek";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ talep?: string; iptal?: string }>;
}) {
  const user = await requireUser({ next: "/hesabim" });
  const { talep, iptal } = await searchParams;
  const { kvkk_consent_at } = getDb()
    .prepare("SELECT kvkk_consent_at FROM users WHERE id = ?")
    .get(user.id) as { kvkk_consent_at: number | null };
  const all = patientAppointments(user.id, { since: kvkk_consent_at ?? 0 });
  const today = istanbulDate();
  const upcoming = all.filter((a) => a.date >= today && ["pending", "confirmed"].includes(a.status)).reverse();
  const past = all.filter((a) => !upcoming.includes(a));

  return (
    <AuthShell eyebrow="Hesabım" title={`Merhaba ${user.firstName}`} wide>
      <div className="space-y-4">
        {talep === "alindi" && (
          <Alert tone="success">
            Randevu talebiniz alındı. Klinik onayladığında aşağıda “Onaylandı” olarak görünecek.
          </Alert>
        )}
        {iptal === "tamam" && <Alert tone="success">Randevunuz iptal edildi.</Alert>}
        {iptal === "olmadi" && (
          <Alert>
            Bu randevu artık online iptal edilemiyor. Lütfen klinikle telefonla
            iletişime geçin: {contact.phone.display}
          </Alert>
        )}
      </div>

      <section aria-labelledby="yaklasan" className="mt-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 id="yaklasan" className="text-[2rem] text-ink">Yaklaşan randevular</h2>
          <ButtonLink href="/randevu">Yeni Randevu Talebi</ButtonLink>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-6 text-muted">Yaklaşan bir randevunuz yok.</p>
        ) : (
          <ul className="mt-6 border-t border-stone-deep">
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-col gap-4 border-b border-stone-deep py-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-serif text-[1.5rem] capitalize leading-tight text-ink">
                    {formatDateLong(a.date)} · <span className="tabular-nums lining-nums">{a.time}</span>
                  </p>
                  <p className="mt-1 text-[0.9375rem] text-muted">{doctorName(a.doctor_slug)}</p>
                  <div className="mt-3">
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                {canPatientCancel(a) && (
                  <form action={cancelAppointment}>
                    <input type="hidden" name="id" value={a.id} />
                    <SubmitButton variant="danger" pendingText="İptal ediliyor…">
                      Randevuyu İptal Et
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="gecmis" className="mt-16">
          <h2 id="gecmis" className="text-[1.75rem] text-ink">Geçmiş ve iptal edilenler</h2>
          <ul className="mt-6 border-t border-stone-deep">
            {past.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-deep py-4 text-[0.9375rem]">
                <span className="capitalize text-ink">
                  {formatDateLong(a.date)} · <span className="tabular-nums lining-nums">{a.time}</span>
                  <span className="ml-2 text-muted">{doctorName(a.doctor_slug)}</span>
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="bilgiler" className="mt-16 grid gap-8 border-t border-stone-deep pt-10 sm:grid-cols-2">
        <div>
          <h2 id="bilgiler" className="text-[1.75rem] text-ink">Bilgilerim</h2>
          <dl className="mt-5 space-y-3 text-[0.9375rem]">
            <div><dt className="text-muted">Ad soyad</dt><dd className="text-ink">{user.firstName} {user.lastName}</dd></div>
            <div><dt className="text-muted">Cep telefonu</dt><dd className="text-ink">{formatMobile(user.phone)}</dd></div>
            {user.email && <div><dt className="text-muted">E-posta</dt><dd className="text-ink">{user.email}</dd></div>}
          </dl>
        </div>
        <div className="flex flex-col items-start gap-4 sm:items-end sm:justify-end">
          <Link href="/hesabim/sifre" className="text-[0.9375rem] text-forest underline decoration-gold underline-offset-4">
            Şifremi değiştir
          </Link>
          <LogoutButton />
        </div>
      </section>
    </AuthShell>
  );
}
