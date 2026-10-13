import { readEvents } from "@/server/sync";
import { json, withSyncAuth } from "@/server/sync-api";

/**
 * Değişiklik akışı. Yönetim sitesi son aldığı `seq` değerini saklar ve
 * `?after=<seq>` ile devam eder; `has_more` true ise hemen tekrar çağırır.
 */
export const GET = withSyncAuth((req) => {
  const after = Math.max(0, Number(req.nextUrl.searchParams.get("after") ?? 0) || 0);
  const limit = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 100) || 100));
  return json(readEvents(after, limit));
});
