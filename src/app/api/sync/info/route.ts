import { booking, clinic, doctors } from "@/config/site";
import { activeSchedule, bookingOpen } from "@/lib/booking-status";
import { getDb } from "@/server/db";
import { json, withSyncAuth } from "@/server/sync-api";

/** Yönetim sitesinin bağlantıyı test etmesi ve ayarları öğrenmesi için */
export const GET = withSyncAuth(() => {
  const { latest } = getDb().prepare("SELECT COALESCE(MAX(seq), 0) AS latest FROM sync_events").get() as {
    latest: number;
  };
  return json({
    clinic: clinic.name,
    api_version: 1,
    latest_seq: latest,
    booking_open: bookingOpen,
    slot_minutes: booking.slotMinutes,
    schedule: activeSchedule,
    closed_dates: booking.closedDates,
    doctors: doctors.map((d) => ({ slug: d.slug, name: d.name, title: d.title })),
    statuses: ["pending", "confirmed", "cancelled", "rejected", "completed", "no_show"],
  });
});
