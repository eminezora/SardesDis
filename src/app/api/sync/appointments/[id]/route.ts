import { BookingError, updateByStaff, type Status } from "@/server/appointments";
import { appointmentSnapshot } from "@/server/sync";
import { apiError, json, readJson, withSyncAuth } from "@/server/sync-api";

const STATUSES: Status[] = ["pending", "confirmed", "cancelled", "rejected", "completed", "no_show"];

type Ctx = { params: Promise<{ id: string }> };

/** Tek randevunun güncel hali */
export const GET = withSyncAuth<Ctx>(async (_req, ctx) => {
  const appointment = appointmentSnapshot(Number((await ctx.params).id));
  return appointment ? json({ appointment }) : apiError(404, "not_found", "Randevu bulunamadı.");
});

/**
 * Klinik kararını hasta sitesine işler: onay, uygun değil, iptal, tamamlandı,
 * gelmedi. Onaylarken hekim atanabilir. Hasta durumu "Hesabım"da görür.
 * Gövde: { status, doctor_slug? }
 * İzin verilen geçişler: pending → confirmed | rejected;
 * confirmed → cancelled | (saati geçtiyse) completed | no_show
 */
export const PATCH = withSyncAuth<Ctx>(async (req, ctx) => {
  const id = Number((await ctx.params).id);
  const body = await readJson(req);
  if (!body) return apiError(400, "invalid_json", "Gövde JSON nesnesi olmalı.");
  const status = String(body.status ?? "") as Status;
  if (!STATUSES.includes(status)) return apiError(400, "invalid_status", `status şunlardan biri olmalı: ${STATUSES.join(", ")}`);
  const doctor =
    !("doctor_slug" in body) ? undefined : body.doctor_slug == null || body.doctor_slug === "" ? null : String(body.doctor_slug);

  try {
    updateByStaff(id, status, doctor);
  } catch (e) {
    if (e instanceof BookingError) {
      return apiError(e.message === "Randevu bulunamadı." ? 404 : 409, "update_rejected", e.message);
    }
    throw e;
  }
  return json({ appointment: appointmentSnapshot(id) });
});
