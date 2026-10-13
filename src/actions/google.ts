"use server";

import { redirect } from "next/navigation";
import { bookingOpen } from "@/lib/booking-status";
import { normalizeMobile, str, validName, type FieldErrors } from "@/lib/validation";
import { createSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { recordEvent } from "@/server/sync";
import { clearPending, readPending } from "@/server/google-pending";
import type { FormState } from "./auth";

/**
 * Google ile gelen yeni hastanın kaydını tamamlar (telefon + KVKK onayı).
 * Şifre alanına kullanılamayan bir değer yazılır; hasta Google ile giriş yapar.
 */
const GOOGLE_ONLY_HASH = "!google";

export async function completeGoogleSignup(_: FormState, form: FormData): Promise<FormState> {
  if (!bookingOpen) return { error: "Online kayıt şu anda kapalı." };
  const pending = await readPending();
  if (!pending) return { error: "Oturumun süresi doldu. Lütfen Google ile yeniden giriş yapın." };

  const values = {
    firstName: str(form, "firstName"),
    lastName: str(form, "lastName"),
    phone: str(form, "phone"),
  };
  const fields: FieldErrors = {};
  if (!validName(values.firstName)) fields.firstName = "Lütfen adınızı yazın.";
  if (!validName(values.lastName)) fields.lastName = "Lütfen soyadınızı yazın.";
  const phone = normalizeMobile(values.phone);
  if (!phone) fields.phone = "Cep telefonunuzu 05xx xxx xx xx biçiminde yazın.";
  if (form.get("kvkk") !== "on") fields.kvkk = "Devam etmek için aydınlatma metnini onaylamanız gerekir.";
  if (Object.keys(fields).length) return { fields, values };

  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(pending.email)) {
    return { values, error: "Bu e-posta ile kayıtlı bir hesap var. Lütfen giriş yapın." };
  }
  const byPhone = db
    .prepare("SELECT id, role, password_hash IS NULL AS unclaimed FROM users WHERE phone = ?")
    .get(phone) as { id: number; role: string; unclaimed: number } | undefined;
  if (byPhone && !(byPhone.role === "patient" && byPhone.unclaimed)) {
    return {
      values,
      error:
        "Bu telefon numarasıyla kayıtlı bir hesap var. Telefon numaranız ve şifrenizle giriş yapın ya da klinikle iletişime geçin.",
    };
  }

  const now = Date.now();
  let userId: number;
  if (byPhone) {
    // Klinikte telefonla açılmış (şifresiz) kaydı sahiplen; geçmiş randevular korunur
    db.prepare(
      `UPDATE users SET first_name = ?, last_name = ?, email = ?, password_hash = ?, google_sub = ?, kvkk_consent_at = ?
        WHERE id = ? AND password_hash IS NULL`,
    ).run(values.firstName, values.lastName, pending.email, GOOGLE_ONLY_HASH, pending.sub, now, byPhone.id);
    userId = byPhone.id;
    recordEvent(db, "patient.updated", userId);
  } else {
    const r = db
      .prepare(
        `INSERT INTO users (role, first_name, last_name, phone, email, password_hash, google_sub, kvkk_consent_at, created_at)
         VALUES ('patient', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(values.firstName, values.lastName, phone, pending.email, GOOGLE_ONLY_HASH, pending.sub, now, now);
    userId = Number(r.lastInsertRowid);
    recordEvent(db, "patient.created", userId);
  }

  await clearPending(pending.hash);
  await createSession(userId);
  const next = pending.next.startsWith("/") && !pending.next.startsWith("//") ? pending.next : "/randevu";
  redirect(next);
}
