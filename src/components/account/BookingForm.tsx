"use client";

import { useActionState, useMemo, useState } from "react";
import { bookAppointment } from "@/actions/appointments";
import type { FormState } from "@/actions/auth";
import { Alert, SubmitButton } from "@/components/forms";
import { formatDateLong, formatDateShort } from "@/lib/time";

type Slot = { time: string; freeDoctors: string[]; anyFree: boolean };
type Day = { date: string; slots: Slot[] };
type DoctorOption = { slug: string; label: string };

const ANY = "any";

/**
 * Üç adımlı seçim: hekim → gün → saat. Boş saatler sunucuda hesaplanır;
 * gönderimde sunucu tekrar kontrol eder (aynı anda alınan saatler için).
 */
export function BookingForm({ days, doctors }: { days: Day[]; doctors: DoctorOption[] }) {
  const [state, action] = useActionState<FormState, FormData>(bookAppointment, {});
  const [doctor, setDoctor] = useState(ANY);

  const visibleDays = useMemo(
    () =>
      days
        .map((d) => ({
          ...d,
          slots: d.slots.filter((s) => (doctor === ANY ? s.anyFree : s.freeDoctors.includes(doctor))),
        }))
        .filter((d) => d.slots.length > 0),
    [days, doctor],
  );

  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const day = visibleDays.find((d) => d.date === date) ?? null;
  const validTime = day?.slots.some((s) => s.time === time) ? time : null;

  const chip =
    "inline-flex min-h-11 items-center justify-center rounded-[2px] border px-4 text-[0.9375rem] transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest";
  const chipOn = "border-forest bg-forest text-paper";
  const chipOff = "border-stone-deep bg-paper text-ink hover:border-forest";

  return (
    <form action={action} className="space-y-12">
      {state.error && <Alert>{state.error}</Alert>}

      <fieldset>
        <legend className="font-serif text-[1.625rem] text-ink">1. Hekim</legend>
        <div className="mt-5 flex flex-wrap gap-3">
          {[{ slug: ANY, label: "Fark etmez" }, ...doctors].map((d) => (
            <label key={d.slug} className="cursor-pointer">
              <input
                type="radio"
                name="doctor"
                value={d.slug}
                checked={doctor === d.slug}
                onChange={() => setDoctor(d.slug)}
                className="peer sr-only"
              />
              <span className={`${chip} ${doctor === d.slug ? chipOn : chipOff}`}>{d.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-serif text-[1.625rem] text-ink">2. Gün</legend>
        {visibleDays.length === 0 ? (
          <p className="mt-5 text-muted">
            Seçtiğiniz hekim için önümüzdeki günlerde boş saat görünmüyor. Başka bir
            seçim yapabilir veya klinikle telefonla iletişime geçebilirsiniz.
          </p>
        ) : (
          <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            <div className="flex gap-3 sm:flex-wrap">
              {visibleDays.map((d) => (
                <label key={d.date} className="shrink-0 cursor-pointer">
                  <input
                    type="radio"
                    name="date"
                    value={d.date}
                    checked={date === d.date}
                    onChange={() => setDate(d.date)}
                    className="peer sr-only"
                    aria-label={formatDateLong(d.date)}
                  />
                  <span className={`${chip} ${date === d.date ? chipOn : chipOff} capitalize`}>
                    {formatDateShort(d.date)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      <fieldset disabled={!day}>
        <legend className="font-serif text-[1.625rem] text-ink">3. Saat</legend>
        {!day ? (
          <p className="mt-5 text-muted">Önce bir gün seçin.</p>
        ) : (
          <>
            <p className="mt-2 text-sm capitalize text-muted">{formatDateLong(day.date)}</p>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {day.slots.map((s) => (
                <label key={s.time} className="cursor-pointer">
                  <input
                    type="radio"
                    name="time"
                    value={s.time}
                    checked={validTime === s.time}
                    onChange={() => setTime(s.time)}
                    className="peer sr-only"
                  />
                  <span className={`${chip} w-full tabular-nums lining-nums ${validTime === s.time ? chipOn : chipOff}`}>
                    {s.time}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>

      <div className="border-t border-stone-deep pt-8">
        <p className="mb-6 max-w-xl text-[0.9375rem] text-muted">
          Gönderdiğiniz talep klinik tarafından onaylandığında kesinleşir. Durumunu
          “Hesabım” sayfasından takip edebilirsiniz.
        </p>
        <SubmitButton disabled={!day || !validTime} pendingText="Talep gönderiliyor…" className="w-full sm:w-auto">
          Randevu Talebi Gönder
        </SubmitButton>
      </div>
    </form>
  );
}
