import { patientSnapshot } from "@/server/sync";
import { apiError, json, withSyncAuth } from "@/server/sync-api";

type Ctx = { params: Promise<{ id: string }> };

/** Tek hastanın güncel bilgileri */
export const GET = withSyncAuth<Ctx>(async (_req, ctx) => {
  const patient = patientSnapshot(Number((await ctx.params).id));
  return patient ? json({ patient }) : apiError(404, "not_found", "Hasta bulunamadı.");
});
