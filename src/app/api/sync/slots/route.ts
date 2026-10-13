import { isValidDate } from "@/lib/time";
import { staffDaySlots } from "@/server/appointments";
import { apiError, json, withSyncAuth } from "@/server/sync-api";

/** Bir günün takvim saatleri ve her saatte boş olan hekimler (telefon randevusu için) */
export const GET = withSyncAuth((req) => {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!isValidDate(date)) return apiError(400, "invalid_date", "date=YYYY-AA-GG biçiminde olmalı.");
  return json({
    date,
    slots: staffDaySlots(date).map((s) => ({ time: s.time, free_doctors: s.freeDoctors, any_free: s.anyFree })),
  });
});
