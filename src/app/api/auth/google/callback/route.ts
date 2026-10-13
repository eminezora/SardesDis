import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { bookingOpen } from "@/lib/booking-status";
import { ACCOUNT_HOME, createSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { exchangeCode, googleEnabled, OAUTH_COOKIE, PENDING_COOKIE } from "@/server/google";

function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function GET(req: NextRequest) {
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/giris?google=${code}`, req.url));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  };
  if (!googleEnabled) return fail("kapali");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("iptal");

  let saved: { state: string; nonce: string; verifier: string; next: string };
  try {
    saved = JSON.parse(Buffer.from(req.cookies.get(OAUTH_COOKIE)?.value ?? "", "base64url").toString("utf8"));
  } catch {
    return fail("sure");
  }
  const code = params.get("code");
  if (!code || !saved?.state || params.get("state") !== saved.state) return fail("sure");

  let profile;
  try {
    profile = await exchangeCode(code, saved.verifier, saved.nonce);
  } catch {
    return fail("hata");
  }

  const db = getDb();
  type Row = { id: number; role: "patient" | "staff"; disabled: number; google_sub: string | null };
  let user = db
    .prepare("SELECT id, role, disabled, google_sub FROM users WHERE google_sub = ?")
    .get(profile.sub) as Row | undefined;

  if (!user) {
    const byEmail = db
      .prepare("SELECT id, role, disabled, google_sub FROM users WHERE email = ?")
      .get(profile.email) as Row | undefined;
    if (byEmail) {
      if (byEmail.role !== "patient") return fail("hesap-yok");
      if (byEmail.google_sub && byEmail.google_sub !== profile.sub) return fail("baska");
      db.prepare("UPDATE users SET google_sub = ? WHERE id = ?").run(profile.sub, byEmail.id);
      user = byEmail;
    }
  }

  if (user) {
    if (user.disabled) return fail("hata");
    // Bu sitede yalnızca hasta hesapları giriş yapabilir
    if (user.role !== "patient") return fail("hesap-yok");
    if (!bookingOpen) return fail("kapali");
    await createSession(user.id);
    const res = NextResponse.redirect(new URL(safeNext(saved.next, ACCOUNT_HOME), req.url));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  }

  // Hesap yok: kaydı tamamlama sayfasına yönlendir
  if (!bookingOpen) return fail("hesap-yok");

  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  db.prepare("DELETE FROM google_pending WHERE expires_at < ?").run(Date.now());
  db.prepare(
    `INSERT INTO google_pending (token_hash, sub, email, given_name, family_name, next, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(hash, profile.sub, profile.email, profile.givenName, profile.familyName, saved.next ?? "", Date.now() + 15 * 60_000);

  const res = NextResponse.redirect(new URL("/kayit/google", req.url));
  res.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth/google" });
  res.cookies.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  return res;
}
