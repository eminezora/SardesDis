import { addDays, istanbulDate, isValidDate } from "@/lib/time";
import { normalizeMobile, validName } from "@/lib/validation";
import { BookingError, createByStaff } from "@/server/appointments";
import { appointmentSnapshot, appointmentsBetween, patientSnapshot } from "@/server/sync";
import { apiError, json, readJson, withSyncAuth } from "@/server/sync-api";

/**
 * GET: tarih aralığındaki randevular (ilk aktarım veya kontrol için).
 *   ?from=YYYY-AA-GG&to=YYYY-AA-GG  (varsayılan: bugünden itibaren 30 gün, en fazla 400 gün)
 */
export const GET = withSyncAuth((req) => {
  const p = req.nextUrl.searchParams;
  const from = p.get("from") ?? istanbulDate();
  const to = p.get("to") ?? addDays(from, 30);
  if (!isValidDate(from) || !isValidDate(to) || to < from) {
    return apiError(400, "invalid_range", "from/to YYYY-AA-GG biçiminde olmalı ve from ≤ to.");
  }
  if (to > addDays(from, 400)) return apiError(400, "range_too_large", "En fazla 400 günlük aralık istenebilir.");
  return json({ from, to, appointments: appointmentsBetween(from, to) });
});

/**
 * POST: klinikte (ör. telefonla) alınan randevuyu ekler; doğrudan onaylıdır
 * ve online takvimde o saati doldurur.
 * Gövde: { patient_id } veya { patient: { first_name, last_name, phone } },
 *        date, time, doctor_slug (veya null), off_schedule (isteğe bağlı)
 */
export const POST = withSyncAuth(async (req) => {
  const body = await readJson(req);
  if (!body) return apiError(400, "invalid_json", "Gövde JSON nesnesi olmalı.");

  const date = String(body.date ?? "");
  const time = String(body.time ?? "");
  if (!isValidDate(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return apiError(400, "invalid_datetime", "date YYYY-AA-GG, time SS:DD biçiminde olmalı.");
  }
  const doctorSlug = body.doctor_slug == null || body.doctor_slug === "" ? null : String(body.doctor_slug);

  let patient: { id: number } | { firstName: string; lastName: string; phone: string };
  if (body.patient_id != null) {
    const id = Number(body.patient_id);
    if (!Number.isInteger(id)) return apiError(400, "invalid_patient", "patient_id tam sayı olmalı.");
    patient = { id };
  } else {
    const np = (body.patient ?? {}) as Record<string, unknown>;
    const firstName = String(np.first_name ?? "").trim();
    const lastName = String(np.last_name ?? "").trim();
    const phone = normalizeMobile(String(np.phone ?? ""));
    if (!validName(firstName) || !validName(lastName) || !phone) {
      return apiError(400, "invalid_patient", "Yeni hasta için geçerli first_name, last_name ve cep telefonu gerekli.");
    }
    patient = { firstName, lastName, phone };
  }

  try {
    const id = createByStaff({ patient, date, time, doctorSlug, offSchedule: body.off_schedule === true });
    const appointment = appointmentSnapshot(id);
    return json({ appointment, patient: appointment ? patientSnapshot(appointment.patient_id) : null }, 201);
  } catch (e) {
    if (e instanceof BookingError) return apiError(409, "booking_conflict", e.message);
    throw e;
  }
});
