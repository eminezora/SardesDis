"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  addAppointment,
  daySlots,
  findPatients,
  type AddAppointmentState,
} from "@/actions/staff";
import { Alert, SubmitButton } from "@/components/forms";
import { formatDateLong } from "@/lib/time";

type Slot = { time: string; freeDoctors: string[]; anyFree: boolean };
type PatientHit = { id: number; name: string; phone: string | null; hasAccount: boolean };
type DoctorOption = { slug: string; label: string };

const input =
  "mt-1 block min-h-10 w-full rounded-[2px] border border-stone-deep bg-paper px-3 text-ink";
const chip =
  "inline-flex min-h-10 w-full items-center justify-center rounded-[2px] border px-3 text-sm tabular-nums lining-nums transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest";

/**
 * Telefonla alınan randevuyu panele ekler. Saatler online takvimle aynı
 * kurallardan gelir; takvim dışı saat de girilebilir. Sunucu her durumda
 * çakışmayı yeniden kontrol eder.
 */
export function AddAppointment({
  doctors,
  today,
  defaultDate,
}: {
  doctors: DoctorOption[];
  today: string;
  defaultDate: string;
}) {
  const [state, action] = useActionState<AddAppointmentState, FormData>(addAppointment, {});
  return (
    <form action={action} className="space-y-8" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      {/* Başarılı kayıttan sonra alanlar sıfırlanır; hatada korunur */}
      <Fields key={state.seq ?? 0} fields={state.fields ?? {}} doctors={doctors} today={today} defaultDate={defaultDate} />
    </form>
  );
}

function Fields({
  fields: f,
  doctors,
  today,
  defaultDate,
}: {
  fields: Partial<Record<string, string>>;
  doctors: DoctorOption[];
  today: string;
  defaultDate: string;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PatientHit[]>([]);
  const [patient, setPatient] = useState<PatientHit | null>(null);
  const [newPatient, setNewPatient] = useState({ firstName: "", lastName: "", phone: "" });

  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState("");
  const [offSchedule, setOffSchedule] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [loadingSlots, startSlots] = useTransition();
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    let stale = false;
    if (!date) return;
    startSlots(async () => {
      const s = await daySlots(date);
      if (!stale) setSlots(s);
    });
    return () => {
      stale = true;
    };
  }, [date]);

  useEffect(() => {
    let stale = false;
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      startSearch(async () => {
        const r = await findPatients(q);
        if (!stale) setHits(r);
      });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query]);

  const usable = (s: Slot) => (doctor ? s.freeDoctors.includes(doctor) : s.anyFree);
  const validTime = slots?.some((s) => s.time === time && usable(s)) ? time : "";
  const visibleHits = query.trim().length < 2 ? [] : hits;

  return (
    <>
      <fieldset>
        <legend className="font-serif text-[1.375rem] text-ink">Hasta</legend>
        <input type="hidden" name="patientMode" value={mode} />
        <div className="mt-3 flex gap-6 text-sm">
          {(["existing", "new"] as const).map((m) => (
            <label key={m} className="flex items-center gap-2">
              <input type="radio" checked={mode === m} onChange={() => setMode(m)} className="accent-[var(--color-forest)]" />
              {m === "existing" ? "Kayıtlı hasta" : "Yeni hasta"}
            </label>
          ))}
        </div>

        {mode === "existing" ? (
          <div className="mt-4 max-w-xl text-sm">
            <input type="hidden" name="patientId" value={patient?.id ?? ""} />
            {patient ? (
              <p className="flex flex-wrap items-center gap-3 text-[0.9375rem] text-ink">
                <span className="font-medium">{patient.name}</span>
                <span className="text-muted">{patient.phone}</span>
                <button type="button" onClick={() => setPatient(null)} className="text-sm text-forest underline underline-offset-4">
                  Değiştir
                </button>
              </p>
            ) : (
              <>
                <label className="text-muted">
                  Ad, telefon veya e-posta ile ara
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-invalid={f.patient ? true : undefined}
                    className={input}
                  />
                </label>
                {searching && <p className="mt-2 text-muted">Aranıyor…</p>}
                {!searching && query.trim().length >= 2 && visibleHits.length === 0 && (
                  <p className="mt-2 text-muted">Eşleşen hasta yok. “Yeni hasta” seçeneğini kullanın.</p>
                )}
                {visibleHits.length > 0 && (
                  <ul className="mt-2 border-t border-stone-deep">
                    {visibleHits.map((h) => (
                      <li key={h.id} className="border-b border-stone-deep">
                        <button
                          type="button"
                          onClick={() => setPatient(h)}
                          className="flex w-full flex-wrap items-baseline gap-3 py-2 text-left hover:text-forest"
                        >
                          <span className="font-medium text-ink">{h.name}</span>
                          <span className="text-muted">{h.phone}</span>
                          {!h.hasAccount && <span className="text-xs text-muted">(online hesabı yok)</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {f.patient && <p className="mt-1.5 text-[#9b3b2f]">{f.patient}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 grid max-w-3xl gap-4 text-sm sm:grid-cols-3">
            {(
              [
                ["firstName", "Ad", "text"],
                ["lastName", "Soyad", "text"],
                ["phone", "Cep telefonu", "tel"],
              ] as const
            ).map(([name, label, type]) => (
              <label key={name} className="text-muted">
                {label}
                <input
                  name={name}
                  type={type}
                  inputMode={type === "tel" ? "tel" : undefined}
                  value={newPatient[name]}
                  onChange={(e) => setNewPatient({ ...newPatient, [name]: e.target.value })}
                  aria-invalid={f[name] ? true : undefined}
                  className={input}
                />
                {f[name] && <span className="mt-1 block text-[#9b3b2f]">{f[name]}</span>}
              </label>
            ))}
            <p className="text-muted sm:col-span-3">
              Hasta online hesabı olmadan kaydedilir. İsterse daha sonra aynı telefonla /kayit
              sayfasından KVKK onayı vererek hesabını açar ve bu randevuyu orada görür.
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className="grid max-w-3xl gap-4 text-sm sm:grid-cols-2">
        <legend className="mb-3 font-serif text-[1.375rem] text-ink">Hekim ve gün</legend>
        <label className="text-muted">
          Hekim
          <select name="doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)} className={input}>
            <option value="">Belirlenmedi</option>
            {doctors.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-muted">
          Gün
          <input
            type="date"
            name="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSlots(null);
            }}
            aria-invalid={f.date ? true : undefined}
            className={input}
          />
          {f.date && <span className="mt-1 block text-[#9b3b2f]">{f.date}</span>}
        </label>
      </fieldset>

      <fieldset>
        <legend className="font-serif text-[1.375rem] text-ink">Saat</legend>
        {date && <p className="mt-1 text-sm capitalize text-muted">{formatDateLong(date)}</p>}
        <input type="hidden" name="time" value={validTime} />
        {!offSchedule &&
          (loadingSlots || !slots ? (
            <p className="mt-3 text-sm text-muted">{date ? "Saatler yükleniyor…" : "Önce bir gün seçin."}</p>
          ) : slots.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Bu gün için takvimde (kalan) saat yok.</p>
          ) : (
            <div className="mt-3 grid max-w-3xl grid-cols-4 gap-2 sm:grid-cols-8">
              {slots.map((s) => {
                const ok = usable(s);
                const on = validTime === s.time;
                return (
                  <label key={s.time} className={ok ? "cursor-pointer" : "cursor-not-allowed"} title={ok ? undefined : "Dolu"}>
                    <input
                      type="radio"
                      checked={on}
                      disabled={!ok}
                      onChange={() => setTime(s.time)}
                      className="peer sr-only"
                      aria-label={ok ? s.time : `${s.time} dolu`}
                    />
                    <span
                      className={`${chip} ${
                        on
                          ? "border-forest bg-forest text-paper"
                          : ok
                            ? "border-stone-deep bg-paper text-ink hover:border-forest"
                            : "border-stone-deep/60 bg-stone/40 text-muted line-through"
                      }`}
                    >
                      {s.time}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}

        <label className="mt-4 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="offSchedule"
            checked={offSchedule}
            onChange={(e) => setOffSchedule(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-forest)]"
          />
          Takvim dışı saat gir
        </label>
        {offSchedule && (
          <label className="mt-3 block max-w-48 text-sm text-muted">
            Saat
            <input
              type="time"
              name="customTime"
              step={300}
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className={input}
            />
            <span className="mt-1 block">Çakışma kontrolü yine yapılır.</span>
          </label>
        )}
        {f.time && <p className="mt-1.5 text-sm text-[#9b3b2f]">{f.time}</p>}
      </fieldset>

      <SubmitButton pendingText="Ekleniyor…" className="!min-h-11">
        Randevuyu ekle (onaylı)
      </SubmitButton>
    </>
  );
}
