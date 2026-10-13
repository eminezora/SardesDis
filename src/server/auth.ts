import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";

/**
 * Bu site yalnızca hastalara açıktır: oturum açabilen tek rol "patient".
 * (Veritabanındaki "staff" rolü ileride ayrı yönetim sitesi için ayrılmıştır;
 * bu sitede personel girişi yoktur.)
 */
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  mustChangePassword: boolean;
};

const COOKIE = "sardes_oturum";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Oturum açar: rastgele anahtar çerezde, yalnızca özeti veritabanında tutulur. */
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expires = now + SESSION_MS;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(sha256(token), userId, expires, now);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(COOKIE);
}

/** Kullanıcının diğer cihazlardaki oturumlarını kapatır (şifre değişince) */
export function destroyOtherSessions(userId: number, keepToken?: string) {
  getDb()
    .prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?")
    .run(userId, keepToken ? sha256(keepToken) : "");
}

export async function currentToken() {
  return (await cookies()).get(COOKIE)?.value;
}

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  must_change_pw: number;
};

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    email: r.email,
    mustChangePassword: r.must_change_pw === 1,
  };
}

/** Geçerli oturumun kullanıcısı (istek başına bir kez sorgulanır) */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await currentToken();
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.first_name, u.last_name, u.phone, u.email, u.must_change_pw
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ? AND u.role = 'patient'
          AND u.disabled = 0 AND u.password_hash IS NOT NULL`,
    )
    .get(sha256(token), Date.now()) as UserRow | undefined;
  return row ? rowToUser(row) : null;
});

/**
 * Giriş zorunlu sayfalar için. Geçici şifreyle girildiyse (klinik tarafından
 * sıfırlanmışsa) önce şifre belirleme sayfasına yönlendirir.
 */
export async function requireUser(opts: { next?: string; passwordPage?: boolean } = {}): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(opts.next ? `/giris?sonra=${encodeURIComponent(opts.next)}` : "/giris");
  if (user.mustChangePassword && !opts.passwordPage) redirect("/hesabim/sifre");
  return user;
}

/** Hastanın giriş sonrası ana sayfası */
export const ACCOUNT_HOME = "/hesabim";

/* Giriş denemesi sınırı ------------------------------------------ */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

export function tooManyAttempts(key: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM login_attempts WHERE at < ?").run(Date.now() - WINDOW_MS);
  const { n } = db
    .prepare("SELECT COUNT(*) AS n FROM login_attempts WHERE key = ?")
    .get(key) as { n: number };
  return n >= MAX_FAILS;
}

export function recordFailedAttempt(key: string) {
  getDb().prepare("INSERT INTO login_attempts (key, at) VALUES (?, ?)").run(key, Date.now());
}

export function clearAttempts(key: string) {
  getDb().prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
}
