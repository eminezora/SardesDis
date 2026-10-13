import "server-only";
import { booking, doctors } from "@/config/site";
import { activeSchedule } from "@/lib/booking-status";
import {
  addDays,
  fromMinutes,
  isoWeekday,
  istanbulDate,
  toEpoch,
  toMinutes,
} from "@/lib/time";
import type { DatabaseSync } from "node:sqlite";
import { getDb, transaction } from "./db";

export type Status = "pending" | "confirmed" | "cancelled" | "rejected" | "completed" | "no_show";

/** Saati dolu sayılan durumlar */
const ACTIVE: Status[] = ["pending", "confirmed"];
const ACTIVE_SQL = `status IN ('pending','confirmed')`;

export const statusLabel: Record<Status, string> = {
  pending: "Onay bekliyor",
  confirmed: "Onaylandı",
  cancelled: "İptal edildi",
  rejected: "Uygun değil",
  completed: "Tamamlandı",
  no_show: "Gelinmedi",
};

export type Slot = {
  time: string;
  /** Bu saatte boş olan hekimlerin slug'ları */
  freeDoctors: string[];
  /** "Fark etmez" seçeneği için uygun mu */
  anyFree: boolean;
};

export type Day = { date: string; slots: Slot[] };

/* Takvim ---------------------------------------------------------- */

/** Bir gün için takvime göre tüm randevu saatleri (dolu/boş ayrımı yapmadan) */
function scheduleTimes(date: string): string[] {
  if (!activeSchedule || booking.closedDates.includes(date)) return [];
  const ranges = activeSchedule[isoWeekday(date)] ?? [];
  const out: string[] = [];
  for (const r of ranges) {
    for (let m = toMinutes(r.start); m + booking.slotMinutes <= toMinutes(r.end); m += booking.slotMinutes) {
      out.push(fromMinutes(m));
    }
  }
  return out;
}

/**
 * Kural: Belirli bir hekim, o saatte kendine ait randevusu yoksa VE o saatteki
 * toplam randevu sayısı hekim sayısından azsa boştur. "Fark etmez" randevuları
 * hekim atanana kadar herhangi bir hekimin yerini tutar.
 */
function freeDoctorsFor(taken: { doctor_slug: string | null }[]): string[] {
  if (taken.length >= doctors.length) return [];
  const busy = new Set(taken.map((t) => t.doctor_slug).filter(Boolean));
  return doctors.map((d) => d.slug).filter((s) => !busy.has(s));
}

/**
 * Her randevu `slotMinutes` sürer. Personelin takvim dışı bir saate (ör. 10:15)
 * eklediği randevu, örtüştüğü takvim saatlerini (10:00 ve 10:30) de doldurur.
 */
function overlapping<T extends { time: string }>(rows: T[], time: string): T[] {
  const m = toMinutes(time);
  return rows.filter((r) => Math.abs(toMinutes(r.time) - m) < booking.slotMinutes);
}

/** Bir günün aktif randevuları (işlem içinde de kullanılır) */
function activeOn(db: DatabaseSync, date: string) {
  return db
    .prepare(`SELECT id, patient_id, time, doctor_slug FROM appointments WHERE date = ? AND ${ACTIVE_SQL}`)
    .all(date) as { id: number; patient_id: number; time: string; doctor_slug: string | null }[];
}

/** Önümüzdeki günlerin boş saatleri */
export function availableDays(now = Date.now()): Day[] {
  const today = istanbulDate(now);
  const last = addDays(today, booking.maxDaysAhead);
  const earliest = now + booking.minLeadHours * 60 * 60 * 1000;

  const rows = getDb()
    .prepare(
      `SELECT date, time, doctor_slug FROM appointments
        WHERE ${ACTIVE_SQL} AND date BETWEEN ? AND ?`,
    )
    .all(today, last) as { date: string; time: string; doctor_slug: string | null }[];

  const byDate = new Map<string, { time: string; doctor_slug: string | null }[]>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);

  const days: Day[] = [];
  for (let date = today; date <= last; date = addDays(date, 1)) {
    const slots = scheduleTimes(date)
      .filter((t) => toEpoch(date, t) >= earliest)
      .map((time) => {
        const freeDoctors = freeDoctorsFor(overlapping(byDate.get(date) ?? [], time));
        return { time, freeDoctors, anyFree: freeDoctors.length > 0 };
      })
      .filter((s) => s.anyFree);
    if (slots.length) days.push({ date, slots });
  }
  return days;
}

/* Hasta işlemleri ------------------------------------------------- */

export class BookingError extends Error {}

export function createAppointment(input: {
  patientId: number;
  date: string;
  time: string;
  doctorSlug: string | null;
}) {
  const { patientId, date, time, doctorSlug } = input;
  const now = Date.now();

  if (doctorSlug && !doctors.some((d) => d.slug === doctorSlug)) {
    throw new BookingError("Geçersiz hekim seçimi.");
  }
  if (!scheduleTimes(date).includes(time)) {
    throw new BookingError("Seçilen saat randevu takviminde yok.");
  }
  const at = toEpoch(date, time);
  if (at < now + booking.minLeadHours * 3600_000) {
    throw new BookingError("Bu saat için artık randevu alınamıyor.");
  }
  if (date > addDays(istanbulDate(now), booking.maxDaysAhead)) {
    throw new BookingError("Bu tarih için henüz randevu alınamıyor.");
  }

  // Kontrol ve kayıt tek işlemde: aynı saate iki kişi aynı anda yazamaz
  return transaction((db) => {
    const today = istanbulDate(now);
    const { n } = db
      .prepare(
        `SELECT COUNT(*) AS n FROM appointments
          WHERE patient_id = ? AND ${ACTIVE_SQL} AND date >= ?`,
      )
      .get(patientId, today) as { n: number };
    if (n >= booking.maxActivePerPatient) {
      throw new BookingError(
        `Aynı anda en fazla ${booking.maxActivePerPatient} aktif randevunuz olabilir. Yeni randevu için mevcut randevularınızdan birini iptal edebilirsiniz.`,
      );
    }

    const taken = overlapping(activeOn(db, date), time);
    if (taken.some((t) => t.patient_id === patientId)) {
      throw new BookingError("Bu saatte zaten bir randevunuz var.");
    }
    const free = freeDoctorsFor(taken);
    if (doctorSlug ? !free.includes(doctorSlug) : free.length === 0) {
      throw new BookingError("Bu saat az önce doldu. Lütfen başka bir saat seçin.");
    }

    const r = db
      .prepare(
        `INSERT INTO appointments (patient_id, doctor_slug, date, time, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      )
      .run(patientId, doctorSlug, date, time, now, now);
    return Number(r.lastInsertRowid);
  });
}

export type AppointmentRow = {
  id: number;
  patient_id: number;
  doctor_slug: string | null;
  date: string;
  time: string;
  status: Status;
  cancelled_by: "patient" | "staff" | null;
  source: "online" | "staff";
  created_at: number;
};

/**
 * Hastanın randevuları. `since` verilirse yalnızca o andan sonra oluşturulanlar:
 * telefonla açılmış bir kaydı sahiplenen kişi (telefon doğrulaması olmadığı
 * için) sahiplenmeden önceki randevu geçmişini göremez.
 */
export function patientAppointments(
  patientId: number,
  opts: { since?: number; limit?: number } = {},
): AppointmentRow[] {
  return getDb()
    .prepare(
      `SELECT id, patient_id, doctor_slug, date, time, status, cancelled_by, source, created_at
         FROM appointments WHERE patient_id = ? AND created_at >= ?
        ORDER BY date DESC, time DESC LIMIT ?`,
    )
    .all(patientId, opts.since ?? 0, opts.limit ?? 50) as AppointmentRow[];
}

export function canPatientCancel(a: Pick<AppointmentRow, "status" | "date" | "time">, now = Date.now()) {
  return (
    ACTIVE.includes(a.status) &&
    toEpoch(a.date, a.time) - now >= booking.cancelUntilHours * 3600_000
  );
}

export function cancelByPatient(patientId: number, id: number) {
  return transaction((db) => {
    const a = db
      .prepare("SELECT status, date, time FROM appointments WHERE id = ? AND patient_id = ?")
      .get(id, patientId) as Pick<AppointmentRow, "status" | "date" | "time"> | undefined;
    if (!a) throw new BookingError("Randevu bulunamadı.");
    if (!canPatientCancel(a)) {
      throw new BookingError(
        "Bu randevu artık online iptal edilemiyor. Lütfen klinikle telefonla iletişime geçin.",
      );
    }
    db.prepare(
      "UPDATE appointments SET status = 'cancelled', cancelled_by = 'patient', updated_at = ? WHERE id = ?",
    ).run(Date.now(), id);
  });
}

/* Personel işlemleri ---------------------------------------------- */

export type StaffAppointment = AppointmentRow & {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

export function staffAppointments(filter: { from: string; to: string; status?: Status | "active" }) {
  const where = ["a.date BETWEEN ? AND ?"];
  const params: (string | number)[] = [filter.from, filter.to];
  if (filter.status === "active") where.push(`a.${ACTIVE_SQL}`);
  else if (filter.status) {
    where.push("a.status = ?");
    params.push(filter.status);
  }
  return getDb()
    .prepare(
      `SELECT a.id, a.patient_id, a.doctor_slug, a.date, a.time, a.status, a.cancelled_by, a.source, a.created_at,
              u.first_name, u.last_name, u.phone, u.email
         FROM appointments a JOIN users u ON u.id = a.patient_id
        WHERE ${where.join(" AND ")}
        ORDER BY a.date, a.time`,
    )
    .all(...params) as StaffAppointment[];
}

export function pendingCount(): number {
  const { n } = getDb()
    .prepare("SELECT COUNT(*) AS n FROM appointments WHERE status = 'pending' AND date >= ?")
    .get(istanbulDate()) as { n: number };
  return n;
}

/** Personelin yapabileceği durum geçişleri */
const TRANSITIONS: Partial<Record<Status, Status[]>> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["completed", "no_show", "cancelled"],
};

/** "Tamamlandı" ve "Gelmedi" yalnızca randevu saati geldikten sonra seçilebilir */
export function allowedTransitions(
  a: Pick<AppointmentRow, "status" | "date" | "time">,
  now = Date.now(),
): Status[] {
  const started = toEpoch(a.date, a.time) <= now;
  return (TRANSITIONS[a.status] ?? []).filter(
    (s) => started || (s !== "completed" && s !== "no_show"),
  );
}

export function updateByStaff(id: number, next: Status, doctorSlug?: string | null) {
  return transaction((db) => {
    const a = db
      .prepare("SELECT status, date, time, doctor_slug FROM appointments WHERE id = ?")
      .get(id) as Pick<AppointmentRow, "status" | "date" | "time" | "doctor_slug"> | undefined;
    if (!a) throw new BookingError("Randevu bulunamadı.");
    if (!allowedTransitions(a).includes(next)) {
      throw new BookingError("Bu randevu için bu işlem yapılamaz.");
    }

    let slug = a.doctor_slug;
    if (next === "confirmed" && doctorSlug !== undefined && doctorSlug !== a.doctor_slug) {
      if (doctorSlug && !doctors.some((d) => d.slug === doctorSlug)) {
        throw new BookingError("Geçersiz hekim.");
      }
      if (doctorSlug) {
        const clash = overlapping(activeOn(db, a.date), a.time).some(
          (o) => o.id !== id && o.doctor_slug === doctorSlug,
        );
        if (clash) throw new BookingError("Bu hekimin o saatte başka bir randevusu var.");
      }
      slug = doctorSlug;
    }

    db.prepare(
      `UPDATE appointments
          SET status = ?, doctor_slug = ?, cancelled_by = CASE WHEN ? = 'cancelled' THEN 'staff' ELSE cancelled_by END,
              updated_at = ?
        WHERE id = ?`,
    ).run(next, slug, next, Date.now(), id);
  });
}

/* Personelin eklediği randevu (telefonla alınan) ------------------- */

/** Personel formu için bir günün takvim saatleri; dolu olanlar da listelenir */
export function staffDaySlots(date: string, now = Date.now()): Slot[] {
  const rows = activeOn(getDb(), date);
  return scheduleTimes(date)
    .filter((t) => toEpoch(date, t) > now)
    .map((time) => {
      const freeDoctors = freeDoctorsFor(overlapping(rows, time));
      return { time, freeDoctors, anyFree: freeDoctors.length > 0 };
    });
}

export type NewPatient = { firstName: string; lastName: string; phone: string };

/**
 * Telefonla alınan randevuyu doğrudan onaylı olarak ekler. Takvim dışı bir saat
 * yalnızca `offSchedule` ile kabul edilir; çakışma kontrolü her durumda yapılır.
 * Yeni hasta şifresiz kaydedilir (giriş yapamaz); hasta daha sonra aynı
 * telefonla /kayit olarak bu kaydı sahiplenir.
 */
export function createByStaff(input: {
  patient: { id: number } | NewPatient;
  date: string;
  time: string;
  doctorSlug: string | null;
  offSchedule: boolean;
}) {
  const { patient, date, time, doctorSlug, offSchedule } = input;
  const now = Date.now();

  if (doctorSlug && !doctors.some((d) => d.slug === doctorSlug)) {
    throw new BookingError("Geçersiz hekim seçimi.");
  }
  if (!offSchedule && !scheduleTimes(date).includes(time)) {
    throw new BookingError("Bu saat takvimde yok. Takvim dışı saat seçeneğini kullanın.");
  }
  if (toEpoch(date, time) <= now) {
    throw new BookingError("Geçmiş bir saate randevu eklenemez.");
  }

  return transaction((db) => {
    let patientId: number;
    if ("id" in patient) {
      const row = db.prepare("SELECT role FROM users WHERE id = ?").get(patient.id) as
        | { role: string }
        | undefined;
      if (!row || row.role !== "patient") throw new BookingError("Hasta bulunamadı.");
      patientId = patient.id;
    } else {
      const existing = db
        .prepare("SELECT role, first_name, last_name FROM users WHERE phone = ?")
        .get(patient.phone) as { role: string; first_name: string; last_name: string } | undefined;
      if (existing) {
        throw new BookingError(
          existing.role === "patient"
            ? `Bu telefonla kayıtlı bir hasta var (${existing.first_name} ${existing.last_name}). Mevcut hastalardan seçin.`
            : "Bu telefon numarası bir personel hesabına ait.",
        );
      }
      const r = db
        .prepare(
          `INSERT INTO users (role, first_name, last_name, phone, password_hash, created_at)
           VALUES ('patient', ?, ?, ?, NULL, ?)`,
        )
        .run(patient.firstName, patient.lastName, patient.phone, now);
      patientId = Number(r.lastInsertRowid);
    }

    const taken = overlapping(activeOn(db, date), time);
    if (taken.some((t) => t.patient_id === patientId)) {
      throw new BookingError("Hastanın bu saatte zaten bir randevusu var.");
    }
    const free = freeDoctorsFor(taken);
    if (doctorSlug ? !free.includes(doctorSlug) : free.length === 0) {
      throw new BookingError(
        doctorSlug
          ? "Bu hekimin o saatte (veya örtüşen bir saatte) başka bir randevusu var."
          : "Bu saatte boş hekim yok.",
      );
    }

    const r = db
      .prepare(
        `INSERT INTO appointments (patient_id, doctor_slug, date, time, status, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'confirmed', 'staff', ?, ?)`,
      )
      .run(patientId, doctorSlug, date, time, now, now);
    return Number(r.lastInsertRowid);
  });
}

export type PatientHit = { id: number; name: string; phone: string | null; hasAccount: boolean };

/** Personel formundaki hasta araması (ad soyad, e-posta veya telefon) */
export function searchPatients(q: string, phone: string | null): PatientHit[] {
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const rows = getDb()
    .prepare(
      `SELECT id, first_name, last_name, phone, password_hash IS NOT NULL AS has_account
         FROM users
        WHERE role = 'patient' AND disabled = 0
          AND ((first_name || ' ' || last_name) LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR phone = ?)
        ORDER BY first_name, last_name LIMIT 10`,
    )
    .all(like, like, phone ?? "") as {
    id: number;
    first_name: string;
    last_name: string;
    phone: string | null;
    has_account: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`,
    phone: r.phone,
    hasAccount: r.has_account === 1,
  }));
}
