"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { isValidDate } from "@/lib/time";
import { normalizeMobile, str, validName, type FieldErrors } from "@/lib/validation";
import {
  BookingError,
  createByStaff,
  searchPatients,
  staffDaySlots,
  updateByStaff,
  type PatientHit,
  type Slot,
  type Status,
} from "@/server/appointments";
import { getDb } from "@/server/db";
import { audit } from "@/server/records";
import { hashPassword, temporaryPassword } from "@/server/password";

const STATUSES: Status[] = ["pending", "confirmed", "cancelled", "rejected", "completed", "no_show"];

export type StaffActionState = { error?: string; ok?: string; tempPassword?: string };

export async function setAppointmentStatus(
  _: StaffActionState,
  form: FormData,
): Promise<StaffActionState> {
  await requireUser("staff");
  const id = Number(form.get("id"));
  const next = String(form.get("status")) as Status;
  const doctorRaw = form.get("doctor");
  const doctor = doctorRaw === null ? undefined : doctorRaw === "" ? null : String(doctorRaw);
  if (!Number.isInteger(id) || !STATUSES.includes(next)) return { error: "Geçersiz istek." };

  try {
    updateByStaff(id, next, doctor);
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message };
    throw e;
  }
  revalidatePath("/yonetim");
  return { ok: "Güncellendi." };
}

/**
 * Şifresini unutan hasta için geçici şifre üretir. Personel bu şifreyi
 * hastaya telefonda iletir; hasta ilk girişte yeni şifre belirlemek zorundadır.
 */
export async function resetPatientPassword(
  _: StaffActionState,
  form: FormData,
): Promise<StaffActionState> {
  const staff = await requireUser("staff");
  const id = Number(form.get("id"));
  const row = getDb().prepare("SELECT role, password_hash IS NULL AS unclaimed FROM users WHERE id = ?").get(id) as
    | { role: string; unclaimed: number }
    | undefined;
  if (!row || row.role !== "patient") return { error: "Hasta bulunamadı." };
  // Şifresiz (telefonla eklenmiş) hasta online hesabını KVKK onayıyla /kayit üzerinden açar
  if (row.unclaimed) return { error: "Bu hastanın online hesabı yok; /kayit sayfasından kendisi açabilir." };

  const temp = temporaryPassword();
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ?, must_change_pw = 1 WHERE id = ?").run(
    await hashPassword(temp),
    id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  audit(staff.id, "patient.password_reset", { patientId: id });
  return { ok: "Geçici şifre oluşturuldu.", tempPassword: temp };
}

export async function goToDate(form: FormData) {
  await requireUser("staff");
  const d = String(form.get("tarih") ?? "");
  redirect(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `/yonetim?tarih=${d}` : "/yonetim");
}

/* Telefonla alınan randevu ------------------------------------------ */

export type AddAppointmentState = {
  error?: string;
  fields?: FieldErrors;
  ok?: string;
  /** Başarılı her kayıtta artar; form bununla sıfırlanır */
  seq?: number;
};

export async function addAppointment(
  prev: AddAppointmentState,
  form: FormData,
): Promise<AddAppointmentState> {
  await requireUser("staff");
  const fields: FieldErrors = {};

  let patient: { id: number } | { firstName: string; lastName: string; phone: string } | null = null;
  if (str(form, "patientMode") === "new") {
    const firstName = str(form, "firstName");
    const lastName = str(form, "lastName");
    const phone = normalizeMobile(str(form, "phone"));
    if (!validName(firstName)) fields.firstName = "Adı yazın.";
    if (!validName(lastName)) fields.lastName = "Soyadı yazın.";
    if (!phone) fields.phone = "Cep telefonunu 05xx xxx xx xx biçiminde yazın.";
    if (phone && !fields.firstName && !fields.lastName) patient = { firstName, lastName, phone };
  } else {
    const id = Number(form.get("patientId"));
    if (Number.isInteger(id) && id > 0) patient = { id };
    else fields.patient = "Bir hasta seçin.";
  }

  const date = str(form, "date");
  const offSchedule = form.get("offSchedule") === "on";
  const time = str(form, offSchedule ? "customTime" : "time");
  if (!isValidDate(date)) fields.date = "Bir gün seçin.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fields.time = "Bir saat seçin.";
  const doctor = str(form, "doctor");

  if (Object.keys(fields).length || !patient) return { fields, seq: prev.seq };

  try {
    createByStaff({ patient, date, time, doctorSlug: doctor || null, offSchedule });
  } catch (e) {
    if (e instanceof BookingError) return { error: e.message, seq: prev.seq };
    throw e;
  }
  revalidatePath("/yonetim");
  return { ok: `${date} ${time} randevusu eklendi ve onaylandı.`, seq: (prev.seq ?? 0) + 1 };
}

/** Randevu ekleme formu: seçilen günün takvim saatleri ve boş hekimler */
export async function daySlots(date: string): Promise<Slot[]> {
  await requireUser("staff");
  return isValidDate(date) ? staffDaySlots(date) : [];
}

export async function findPatients(q: string): Promise<PatientHit[]> {
  await requireUser("staff");
  const query = String(q).trim().slice(0, 60);
  if (query.length < 2) return [];
  return searchPatients(query, normalizeMobile(query));
}
