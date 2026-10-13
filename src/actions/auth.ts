"use server";

import { redirect } from "next/navigation";
import { bookingOpen } from "@/lib/booking-status";
import {
  normalizeEmail,
  normalizeMobile,
  passwordProblem,
  str,
  validName,
  type FieldErrors,
} from "@/lib/validation";
import {
  clearAttempts,
  createSession,
  currentToken,
  destroyOtherSessions,
  destroySession,
  getCurrentUser,
  ACCOUNT_HOME,
  recordFailedAttempt,
  tooManyAttempts,
} from "@/server/auth";
import { getDb } from "@/server/db";
import { recordEvent } from "@/server/sync";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/server/password";

export type FormState = {
  error?: string;
  fields?: FieldErrors;
  values?: Record<string, string>;
  ok?: string;
};

/** Yalnızca site içi göreli yollara yönlendir (açık yönlendirme olmasın) */
function safeNext(next: string, fallback: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/* Kayıt ----------------------------------------------------------- */

export async function register(_: FormState, form: FormData): Promise<FormState> {
  if (!bookingOpen) return { error: "Online kayıt şu anda kapalı." };

  const values = {
    firstName: str(form, "firstName"),
    lastName: str(form, "lastName"),
    phone: str(form, "phone"),
    email: str(form, "email"),
  };
  const password = String(form.get("password") ?? "");
  const fields: FieldErrors = {};

  if (!validName(values.firstName)) fields.firstName = "Lütfen adınızı yazın.";
  if (!validName(values.lastName)) fields.lastName = "Lütfen soyadınızı yazın.";
  const phone = normalizeMobile(values.phone);
  if (!phone) fields.phone = "Cep telefonunuzu 05xx xxx xx xx biçiminde yazın.";
  const email = values.email ? normalizeEmail(values.email) : null;
  if (values.email && !email) fields.email = "Geçerli bir e-posta adresi yazın ya da boş bırakın.";
  const pwProblem = passwordProblem(password, [values.firstName, values.lastName, values.phone, values.email.split("@")[0]]);
  if (pwProblem) fields.password = pwProblem;
  if (password !== String(form.get("password2") ?? "")) fields.password2 = "Şifreler aynı değil.";
  if (form.get("kvkk") !== "on") fields.kvkk = "Devam etmek için aydınlatma metnini onaylamanız gerekir.";

  if (Object.keys(fields).length) return { fields, values };

  const db = getDb();
  const taken = db
    .prepare(
      "SELECT id, role, password_hash IS NULL AS unclaimed FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)",
    )
    .all(phone, email) as { id: number; role: "patient" | "staff"; unclaimed: number }[];

  // Klinikte telefonla randevu almış, online hesabı olmayan hasta: kaydını sahiplenir
  const claim = taken.length === 1 && taken[0].role === "patient" && taken[0].unclaimed === 1 ? taken[0] : null;
  if (taken.length && !claim) {
    return {
      values,
      error: "Bu telefon numarası veya e-posta ile kayıtlı bir hesap var. Giriş yapmayı deneyin.",
    };
  }

  const now = Date.now();
  const hash = await hashPassword(password);
  let userId: number;
  if (claim) {
    const r = db
      .prepare(
        `UPDATE users SET first_name = ?, last_name = ?, email = ?, password_hash = ?, kvkk_consent_at = ?
          WHERE id = ? AND phone = ? AND password_hash IS NULL`,
      )
      .run(values.firstName, values.lastName, email, hash, now, claim.id, phone);
    if (r.changes !== 1) {
      return { values, error: "Bu telefon numarası ile kayıtlı bir hesap var. Giriş yapmayı deneyin." };
    }
    userId = claim.id;
    recordEvent(db, "patient.updated", userId);
  } else {
    const r = db
      .prepare(
        `INSERT INTO users (role, first_name, last_name, phone, email, password_hash, kvkk_consent_at, created_at)
         VALUES ('patient', ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(values.firstName, values.lastName, phone, email, hash, now, now);
    userId = Number(r.lastInsertRowid);
    recordEvent(db, "patient.created", userId);
  }

  await createSession(userId);
  redirect(safeNext(str(form, "next"), "/randevu"));
}

/* Giriş ----------------------------------------------------------- */

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const id = str(form, "identifier");
  const password = String(form.get("password") ?? "");
  const values = { identifier: id };
  if (!id || !password) return { values, error: "Telefon/e-posta ve şifrenizi yazın." };

  const byEmail = id.includes("@");
  const key = byEmail ? normalizeEmail(id) : normalizeMobile(id);
  if (!key) return { values, error: "Telefon numarası veya e-posta adresi geçersiz." };

  const attemptKey = `login:${key}`;
  if (tooManyAttempts(attemptKey)) {
    return { values, error: "Çok sayıda hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin." };
  }

  const row = getDb()
    .prepare(
      `SELECT id, role, password_hash, disabled FROM users WHERE ${byEmail ? "email" : "phone"} = ?`,
    )
    .get(key) as { id: number; role: "patient" | "staff"; password_hash: string | null; disabled: number } | undefined;

  // Hesap yoksa (veya telefonla eklenmiş, şifresiz kayıtsa) da aynı sürede yanıt ver
  const ok = await verifyPassword(password, row?.password_hash ?? DUMMY_HASH);
  // Bu sitede yalnızca hasta hesapları giriş yapabilir
  if (!row?.password_hash || !ok || row.disabled || row.role !== "patient") {
    recordFailedAttempt(attemptKey);
    return { values, error: "Bilgiler hatalı. Lütfen kontrol edip tekrar deneyin." };
  }
  if (!bookingOpen) {
    return { values, error: "Hasta hesapları şu anda kullanıma kapalı." };
  }

  clearAttempts(attemptKey);
  await createSession(row.id);
  redirect(safeNext(str(form, "next"), ACCOUNT_HOME));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

/* Şifre değiştirme ------------------------------------------------ */

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  const fields: FieldErrors = {};

  const row = getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as {
    password_hash: string | null;
  };
  if (!row.password_hash || !(await verifyPassword(current, row.password_hash))) {
    fields.current = "Mevcut şifre hatalı.";
  }
  const problem = passwordProblem(next, [user.firstName, user.lastName, user.phone ?? "", (user.email ?? "").split("@")[0]]);
  if (problem) fields.password = problem;
  else if (next === current) fields.password = "Yeni şifre eskisinden farklı olmalı.";
  if (next !== String(form.get("password2") ?? "")) fields.password2 = "Şifreler aynı değil.";
  if (Object.keys(fields).length) return { fields };

  getDb()
    .prepare("UPDATE users SET password_hash = ?, must_change_pw = 0 WHERE id = ?")
    .run(await hashPassword(next), user.id);
  destroyOtherSessions(user.id, await currentToken());

  if (user.mustChangePassword) redirect(ACCOUNT_HOME);
  return { ok: "Şifreniz değiştirildi." };
}
