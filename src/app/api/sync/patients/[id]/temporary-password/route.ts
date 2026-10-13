import { getDb } from "@/server/db";
import { hashPassword, temporaryPassword } from "@/server/password";
import { apiError, json, withSyncAuth } from "@/server/sync-api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Şifresini unutan hasta için geçici şifre üretir. Klinik bu şifreyi hastaya
 * telefonda iletir; hasta ilk girişte yeni şifre belirlemek zorundadır.
 * Hastanın açık oturumları kapatılır. Şifre yalnızca bu yanıtta görünür.
 */
export const POST = withSyncAuth<Ctx>(async (_req, ctx) => {
  const id = Number((await ctx.params).id);
  const db = getDb();
  const row = db.prepare("SELECT role, password_hash FROM users WHERE id = ?").get(id) as
    | { role: string; password_hash: string | null }
    | undefined;
  if (!row || row.role !== "patient") return apiError(404, "not_found", "Hasta bulunamadı.");
  if (!row.password_hash) {
    return apiError(409, "no_account", "Bu hastanın online hesabı yok (klinikte kaydedilmiş).");
  }
  if (row.password_hash === "!google") {
    return apiError(409, "google_account", "Bu hasta Google ile giriş yapıyor; şifresi yok.");
  }

  const temp = temporaryPassword();
  db.prepare("UPDATE users SET password_hash = ?, must_change_pw = 1 WHERE id = ?").run(await hashPassword(temp), id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  return json({ temporary_password: temp, must_change_on_login: true });
});
