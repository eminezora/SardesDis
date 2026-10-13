import "server-only";
import { getDb } from "./db";

/**
 * Hasta dosyası kayıtları: muayene notları, raporlar, röntgen/filmler,
 * fotoğraflar ve belgeler. Kayıtlar silinmez; "silindi" olarak işaretlenir.
 * Her görüntüleme ve değişiklik denetim kaydına (audit_log) yazılır.
 * Yalnızca personel (doktor, asistan) erişebilir.
 */
export type RecordKind = "note" | "report" | "xray" | "photo" | "document";

export const recordKinds: { id: RecordKind; label: string; file: boolean }[] = [
  { id: "note", label: "Muayene / tedavi notu", file: false },
  { id: "report", label: "Rapor", file: true },
  { id: "xray", label: "Röntgen / film", file: true },
  { id: "photo", label: "Fotoğraf", file: true },
  { id: "document", label: "Belge", file: true },
];

export const kindLabel = Object.fromEntries(recordKinds.map((k) => [k.id, k.label])) as Record<RecordKind, string>;

export type PatientRecord = {
  id: number;
  patient_id: number;
  kind: RecordKind;
  title: string;
  body: string | null;
  file_key: string | null;
  file_name: string | null;
  file_mime: string | null;
  file_size: number | null;
  record_date: string;
  created_by: number;
  author_first: string;
  author_last: string;
  created_at: number;
};

export function listRecords(patientId: number): PatientRecord[] {
  return getDb()
    .prepare(
      `SELECT r.id, r.patient_id, r.kind, r.title, r.body, r.file_key, r.file_name, r.file_mime,
              r.file_size, r.record_date, r.created_by, u.first_name AS author_first,
              u.last_name AS author_last, r.created_at
         FROM patient_records r JOIN users u ON u.id = r.created_by
        WHERE r.patient_id = ? AND r.deleted_at IS NULL
        ORDER BY r.record_date DESC, r.created_at DESC`,
    )
    .all(patientId) as PatientRecord[];
}

export function getRecord(id: number): PatientRecord | undefined {
  return getDb()
    .prepare(
      `SELECT r.*, u.first_name AS author_first, u.last_name AS author_last
         FROM patient_records r JOIN users u ON u.id = r.created_by
        WHERE r.id = ? AND r.deleted_at IS NULL`,
    )
    .get(id) as PatientRecord | undefined;
}

export function addRecord(input: {
  patientId: number;
  kind: RecordKind;
  title: string;
  body?: string | null;
  recordDate: string;
  createdBy: number;
  file?: { key: string; name: string; mime: string; size: number };
}): number {
  const r = getDb()
    .prepare(
      `INSERT INTO patient_records
         (patient_id, kind, title, body, file_key, file_name, file_mime, file_size, record_date, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.patientId,
      input.kind,
      input.title,
      input.body ?? null,
      input.file?.key ?? null,
      input.file?.name ?? null,
      input.file?.mime ?? null,
      input.file?.size ?? null,
      input.recordDate,
      input.createdBy,
      Date.now(),
    );
  return Number(r.lastInsertRowid);
}

export function softDeleteRecord(id: number, userId: number) {
  getDb()
    .prepare("UPDATE patient_records SET deleted_at = ?, deleted_by = ? WHERE id = ? AND deleted_at IS NULL")
    .run(Date.now(), userId, id);
}

export function isPatient(id: number): boolean {
  return Boolean(getDb().prepare("SELECT 1 FROM users WHERE id = ? AND role = 'patient'").get(id));
}

/* Denetim kaydı ---------------------------------------------------- */

export type AuditAction =
  | "patient.view"
  | "record.view"
  | "record.create"
  | "record.delete"
  | "patient.password_reset";

export function audit(
  userId: number,
  action: AuditAction,
  target: { patientId?: number; recordId?: number } = {},
) {
  getDb()
    .prepare("INSERT INTO audit_log (user_id, action, patient_id, record_id, at) VALUES (?, ?, ?, ?, ?)")
    .run(userId, action, target.patientId ?? null, target.recordId ?? null, Date.now());
}

export type AuditRow = {
  id: number;
  action: AuditAction;
  at: number;
  first_name: string;
  last_name: string;
  record_id: number | null;
};

export function patientAudit(patientId: number, limit = 30): AuditRow[] {
  return getDb()
    .prepare(
      `SELECT a.id, a.action, a.at, a.record_id, u.first_name, u.last_name
         FROM audit_log a JOIN users u ON u.id = a.user_id
        WHERE a.patient_id = ? ORDER BY a.at DESC LIMIT ?`,
    )
    .all(patientId, limit) as AuditRow[];
}
