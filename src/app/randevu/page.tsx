import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { booking, doctors } from "@/config/site";
import { bookingOpen, previewBooking } from "@/lib/booking-status";
import { getCurrentUser } from "@/server/auth";
import { availableDays } from "@/server/appointments";
import { AuthShell } from "@/components/AuthShell";
import { BookingForm } from "@/components/account/BookingForm";
import { ButtonLink } from "@/components/ButtonLink";
import { Alert } from "@/components/forms";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Online Randevu",
  description: "Sardes Diş Kliniği online randevu talebi.",
};

export default async function BookingPage() {
  if (!bookingOpen) notFound();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AuthShell
        eyebrow="Online randevu"
        title="Randevu talebi"
        intro={
          <p>
            Online randevu talebi oluşturmak için hesabınıza giriş yapın ya da
            birkaç adımda kayıt olun.
          </p>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/giris?sonra=/randevu">Giriş Yap</ButtonLink>
          <ButtonLink href="/kayit?sonra=/randevu" variant="outline">
            Kayıt Ol
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }
  if (user.mustChangePassword) redirect("/hesabim/sifre");
  if (user.role === "staff") redirect("/yonetim");

  const days = availableDays();
  return (
    <AuthShell
      eyebrow="Online randevu"
      title="Randevu talebi"
      wide
      intro={
        <p>
          Merhaba {user.firstName}. Size uygun hekimi, günü ve saati seçin. Randevular{" "}
          {booking.slotMinutes} dakikalık aralıklarla planlanır.{" "}
          <Link href="/hesabim" className="text-forest underline decoration-gold underline-offset-4">
            Randevularım
          </Link>
        </p>
      }
    >
      {previewBooking && !booking.schedule && (
        <div className="mb-10">
          <Alert tone="info">
            Geliştirme önizlemesi: saatler örnek takvimden geliyor ve kliniğin
            gerçek çalışma saatleri değildir. Yayında yalnızca{" "}
            <code>booking.schedule</code> kullanılır.
          </Alert>
        </div>
      )}
      <BookingForm
        days={days}
        doctors={doctors.map((d) => ({ slug: d.slug, label: `Dt. ${d.name}` }))}
      />
    </AuthShell>
  );
}
