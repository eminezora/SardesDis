import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { booking, doctors } from "@/config/site";
import { getDb } from "./db";

/**
 * Yönetim sitesiyle senkronizasyon.
 *
 * Bu site (hasta sitesi) randevu ve hasta kayıtlarının kaynağıdır. Her
 * değişiklik `sync_events` tablosuna artan bir sıra numarasıyla (seq) yazılır.
 * Yönetim sitesi `GET /api/sync/events?after=<son seq>` ile kaldığı yerden
 * çeker; aynı olayı iki kez alsa bile kayıtları `id` ile güncellediği için
 * sonuç değişmez. İsteğe bağlı webhook yalnızca "yeni değişiklik var" der;
 * kişisel veri içermez.
 *
 * Ortam değişkenleri:
 *   SYNC_API_KEY      yönetim sitesinin API anahtarı (en az 32 karakter)
 *   SYNC_WEBHOOK_URL  (isteğe bağlı) değişiklik olunca haber verilecek adres
 */

export type SyncEventType =
  | "patient.created"
  | "patient.updated"
  | "appointment.created"
  | "appointment.updated"
  | "appointment.cancelled";

/** Değişikliği, onu yapan veritabanı işleminin içinde kaydeder */
export function recordEvent(db: DatabaseSync, type: SyncEventType, entityId: number) {
  const entity = type.startsWith("patient.") ? "patient" : "appointment";
  db.prepare("INSERT INTO sync_events (entity, entity_id, type, at) VALUES (?, ?, ?, ?)").run(
    entity,
    entityId,
    type,
    Date.now(),
  );
  scheduleWebhook();
}

/* Anlık görüntüler (API'nin döndürdüğü biçim) ---------------------- */

const iso = (ms: number | null) => (ms == null ? null : new Date(ms).toISOString());

export type PatientSnapshot = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  has_online_account: boolean;
  kvkk_consent_at: string | null;
  created_at: string;
};

export type AppointmentSnapshot = {
  id: number;
  patient_id: number;
  doctor_slug: string | null;
  doctor_name: string | null;
  /** Yerel (İstanbul) tarih ve saat */
  date: string;
  time: string;
  duration_minutes: number;
  status: string;
  source: "online" | "staff";
  cancelled_by: "patient" | "staff" | null;
  created_at: string;
  updated_at: string;
};

export function patientSnapshot(id: number, db = getDb()): PatientSnapshot | null {
  const r = db
    .prepare(
      `SELECT id, first_name, last_name, phone, email, password_hash IS NOT NULL AS has_account,
              kvkk_consent_at, created_at
         FROM users WHERE id = ? AND role = 'patient'`,
    )
    .get(id) as
    | {
        id: number;
        first_name: string;
        last_name: string;
        phone: string | null;
        email: string | null;
        has_account: number;
        kvkk_consent_at: number | null;
        created_at: number;
      }
    | undefined;
  if (!r) return null;
  return {
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
    phone: r.phone,
    email: r.email,
    has_online_account: r.has_account === 1,
    kvkk_consent_at: iso(r.kvkk_consent_at),
    created_at: iso(r.created_at)!,
  };
}

type AppointmentDbRow = {
  id: number;
  patient_id: number;
  doctor_slug: string | null;
  date: string;
  time: string;
  status: string;
  source: "online" | "staff";
  cancelled_by: "patient" | "staff" | null;
  created_at: number;
  updated_at: number;
};

export function toAppointmentSnapshot(r: AppointmentDbRow): AppointmentSnapshot {
  return {
    id: r.id,
    patient_id: r.patient_id,
    doctor_slug: r.doctor_slug,
    doctor_name: r.doctor_slug ? (doctors.find((d) => d.slug === r.doctor_slug)?.name ?? null) : null,
    date: r.date,
    time: r.time,
    duration_minutes: booking.slotMinutes,
    status: r.status,
    source: r.source,
    cancelled_by: r.cancelled_by,
    created_at: iso(r.created_at)!,
    updated_at: iso(r.updated_at)!,
  };
}

const APPOINTMENT_COLS =
  "id, patient_id, doctor_slug, date, time, status, source, cancelled_by, created_at, updated_at";

export function appointmentSnapshot(id: number, db = getDb()): AppointmentSnapshot | null {
  const r = db.prepare(`SELECT ${APPOINTMENT_COLS} FROM appointments WHERE id = ?`).get(id) as
    | AppointmentDbRow
    | undefined;
  return r ? toAppointmentSnapshot(r) : null;
}

export function appointmentsBetween(from: string, to: string): AppointmentSnapshot[] {
  return (
    getDb()
      .prepare(`SELECT ${APPOINTMENT_COLS} FROM appointments WHERE date BETWEEN ? AND ? ORDER BY date, time`)
      .all(from, to) as AppointmentDbRow[]
  ).map(toAppointmentSnapshot);
}

/* Olay akışı ------------------------------------------------------- */

export type SyncEvent = {
  seq: number;
  type: SyncEventType;
  at: string;
  patient?: PatientSnapshot | null;
  appointment?: AppointmentSnapshot | null;
};

/**
 * `after` sıra numarasından sonraki olaylar. Her olay, ilgili kaydın GÜNCEL
 * halini taşır (aynı kayıt için birden fazla olay varsa hepsi aynı güncel
 * hali gösterir). Randevu olaylarında hasta bilgisi de eklenir.
 */
export function readEvents(after: number, limit: number) {
  const db = getDb();
  const rows = db
    .prepare("SELECT seq, entity, entity_id, type, at FROM sync_events WHERE seq > ? ORDER BY seq LIMIT ?")
    .all(after, limit + 1) as { seq: number; entity: string; entity_id: number; type: SyncEventType; at: number }[];
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);

  const events: SyncEvent[] = page.map((r) => {
    if (r.entity === "patient") {
      return { seq: r.seq, type: r.type, at: iso(r.at)!, patient: patientSnapshot(r.entity_id, db) };
    }
    const appointment = appointmentSnapshot(r.entity_id, db);
    return {
      seq: r.seq,
      type: r.type,
      at: iso(r.at)!,
      appointment,
      patient: appointment ? patientSnapshot(appointment.patient_id, db) : null,
    };
  });

  const { latest } = db.prepare("SELECT COALESCE(MAX(seq), 0) AS latest FROM sync_events").get() as {
    latest: number;
  };
  return {
    events,
    next_after: page.length ? page[page.length - 1].seq : after,
    has_more: hasMore,
    latest_seq: latest,
  };
}

/* API anahtarı ----------------------------------------------------- */

const API_KEY = process.env.SYNC_API_KEY ?? "";
export const syncEnabled = API_KEY.length >= 32;

const digest = (s: string) => createHash("sha256").update(s).digest();

/** `Authorization: Bearer <SYNC_API_KEY>` başlığını sabit sürede doğrular */
export function validApiKey(header: string | null): boolean {
  if (!syncEnabled || !header?.startsWith("Bearer ")) return false;
  return timingSafeEqual(digest(header.slice(7).trim()), digest(API_KEY));
}

/* Webhook ---------------------------------------------------------- */

const WEBHOOK_URL = process.env.SYNC_WEBHOOK_URL ?? "";
let webhookTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Değişiklikten kısa süre sonra yönetim sitesine haber verir (birden fazla
 * değişiklik tek bildirimde toplanır). Gövde yalnızca son sıra numarasını
 * içerir; `X-Sardes-Signature` başlığı SYNC_API_KEY ile HMAC-SHA256 imzadır.
 * Bildirim ulaşmasa da veri kaybolmaz: yönetim sitesi olayları yine çeker.
 */
function scheduleWebhook() {
  if (!WEBHOOK_URL || !syncEnabled || webhookTimer) return;
  webhookTimer = setTimeout(() => {
    webhookTimer = null;
    const { latest } = getDb().prepare("SELECT COALESCE(MAX(seq), 0) AS latest FROM sync_events").get() as {
      latest: number;
    };
    const body = JSON.stringify({ event: "changes", latest_seq: latest, sent_at: new Date().toISOString() });
    const signature = createHmac("sha256", API_KEY).update(body).digest("hex");
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-sardes-signature": `sha256=${signature}` },
      body,
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      /* yönetim sitesi kapalıysa sorun değil; olaylar çekilerek alınır */
    });
  }, 500);
}
