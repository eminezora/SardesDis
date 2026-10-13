import type { Metadata } from "next";
import Link from "next/link";
import { doctors } from "@/config/site";
import { goToDate } from "@/actions/staff";
import { bookingMissing, bookingOpen } from "@/lib/booking-status";
import { addDays, formatDateLong, istanbulDate, isValidDate } from "@/lib/time";
import { formatMobile } from "@/lib/validation";
import { requireUser } from "@/server/auth";
import { pendingCount, staffAppointments, allowedTransitions, type Status } from "@/server/appointments";
import { Container } from "@/components/Container";
import { Alert } from "@/components/forms";
import { StatusBadge } from "@/components/account/StatusBadge";
import { AddAppointment } from "@/components/staff/AddAppointment";
import { AppointmentActions } from "@/components/staff/AppointmentActions";
import { StaffNav } from "@/components/staff/StaffNav";

export const metadata: Metadata = { title: "Yönetim", robots: { index: false } };

const doctorOptions = doctors.map((d) => ({ slug: d.slug, label: `Dt. ${d.name}` }));
const doctorName = (slug: string | null) =>
  slug ? `Dt. ${doctors.find((d) => d.slug === slug)?.name ?? slug}` : "Fark etmez";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ tarih?: string; durum?: string }>;
}) {
  const user = await requireUser("staff", { next: "/yonetim" });
  const { tarih, durum } = await searchParams;
  const today = istanbulDate();
  const single = tarih && isValidDate(tarih) ? tarih : null;
  const from = single ?? today;
  const to = single ?? addDays(today, 30);
  const showAll = durum === "tumu";

  const list = staffAppointments({ from, to, status: showAll ? undefined : "active" });
  const byDate = new Map<string, typeof list>();
  for (const a of list) byDate.set(a.date, [...(byDate.get(a.date) ?? []), a]);
  const pending = pendingCount();

  const qs = (p: Record<string, string | null>) => {
    const s = new URLSearchParams();
    if (p.tarih) s.set("tarih", p.tarih);
    if (p.durum) s.set("durum", p.durum);
    const str = s.toString();
    return str ? `/yonetim?${str}` : "/yonetim";
  };

  return (
    <Container className="py-12 md:py-16">
      <StaffNav active="randevular" name={`${user.firstName} ${user.lastName}`} />

      {!bookingOpen && (
        <div className="mt-8">
          <Alert tone="info">
            Online randevu yayında <strong className="font-medium">kapalı</strong>. Açmak için
            eksikler: {bookingMissing.join(", ") || "booking.enabled: true"}.
          </Alert>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[2.5rem] text-ink md:text-[3rem]">Randevular</h1>
          <p className="mt-2 text-muted">
            {single ? <span className="capitalize">{formatDateLong(single)}</span> : "Bugünden itibaren 30 gün"}
            {" · "}
            {pending > 0 ? `${pending} talep onay bekliyor` : "Onay bekleyen talep yok"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <form action={goToDate} className="flex items-end gap-2">
            <label className="text-muted">
              Gün
              <input
                type="date"
                name="tarih"
                defaultValue={single ?? ""}
                className="mt-1 block min-h-10 rounded-[2px] border border-stone-deep bg-paper px-3 text-ink"
              />
            </label>
            <button type="submit" className="min-h-10 rounded-[2px] border border-ink/25 px-4 hover:border-forest">
              Göster
            </button>
          </form>
          <Link href={qs({ tarih: today, durum: durum ?? null })} className="min-h-10 content-center rounded-[2px] border border-ink/25 px-4 hover:border-forest">
            Bugün
          </Link>
          {single && (
            <Link href={qs({ tarih: null, durum: durum ?? null })} className="min-h-10 content-center rounded-[2px] border border-ink/25 px-4 hover:border-forest">
              Önümüzdeki 30 gün
            </Link>
          )}
          <Link
            href={qs({ tarih: single, durum: showAll ? null : "tumu" })}
            className="min-h-10 content-center rounded-[2px] border border-ink/25 px-4 hover:border-forest"
          >
            {showAll ? "Yalnızca aktifler" : "İptaller dahil tümü"}
          </Link>
        </div>
      </div>

      <details className="group mt-10 border border-stone-deep bg-paper">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 font-medium text-ink hover:text-forest">
          Randevu ekle (telefonla alınan)
          <span aria-hidden className="text-muted transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-stone-deep px-5 py-8">
          <AddAppointment
            doctors={doctorOptions}
            today={today}
            defaultDate={single && single >= today ? single : today}
          />
        </div>
      </details>

      {list.length === 0 ? (
        <p className="mt-12 text-muted">Bu aralıkta randevu yok.</p>
      ) : (
        <div className="mt-10 space-y-12">
          {[...byDate].map(([date, items]) => (
            <section key={date} aria-label={formatDateLong(date)}>
              <h2 className="border-b border-stone-deep pb-3 font-serif text-[1.625rem] capitalize text-ink">
                {formatDateLong(date)}
              </h2>
              <ul>
                {items.map((a) => (
                  <li
                    key={a.id}
                    className="grid gap-4 border-b border-stone-deep py-5 md:grid-cols-[5rem_1fr_auto] md:items-start md:gap-8"
                  >
                    <span className="font-serif text-[1.5rem] tabular-nums lining-nums leading-none text-ink">{a.time}</span>
                    <div className="text-[0.9375rem]">
                      <p className="font-medium text-ink">
                        {a.first_name} {a.last_name}
                      </p>
                      <p className="mt-1 text-muted">
                        {a.phone && (
                          <a href={`tel:${a.phone}`} className="underline decoration-stone-deep underline-offset-4 hover:text-forest">
                            {formatMobile(a.phone)}
                          </a>
                        )}
                        {a.email && <span className="ml-3">{a.email}</span>}
                      </p>
                      <p className="mt-1 text-muted">{doctorName(a.doctor_slug)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={a.status as Status} />
                        {a.source === "staff" && <span className="text-xs text-muted">Telefonla eklendi</span>}
                        {a.cancelled_by && (
                          <span className="text-xs text-muted">
                            ({a.cancelled_by === "patient" ? "hasta iptal etti" : "klinik iptal etti"})
                          </span>
                        )}
                      </div>
                    </div>
                    <AppointmentActions
                      id={a.id}
                      status={a.status as Status}
                      transitions={allowedTransitions(a)}
                      doctorSlug={a.doctor_slug}
                      doctors={doctorOptions}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
