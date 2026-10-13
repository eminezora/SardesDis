import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * "Google ile giriş" (OpenID Connect, yetkilendirme kodu + PKCE).
 * Ortam değişkenleri tanımlı değilse özellik kapalıdır ve buton görünmez:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL (ör. https://www.alanadi.com)
 */
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");

export const googleEnabled = Boolean(CLIENT_ID && CLIENT_SECRET && APP_URL);

export const redirectUri = `${APP_URL}/api/auth/google/callback`;
export const OAUTH_COOKIE = "sardes_google";
/** Google ile gelip henüz kaydını tamamlamamış hasta için kısa ömürlü çerez */
export const PENDING_COOKIE = "sardes_google_kayit";

const b64url = (b: Buffer) => b.toString("base64url");

export function startParams() {
  const state = b64url(randomBytes(24));
  const nonce = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), state, nonce, verifier };
}

export type GoogleProfile = {
  sub: string;
  email: string;
  givenName: string;
  familyName: string;
};

/**
 * Kodu Google'ın token uç noktasında değiştirir. Kimlik belirteci doğrudan
 * Google'dan TLS ile alındığı için (OIDC Core 3.1.3.7) imza yerine alan
 * kontrolleri yapılır: iss, aud, exp, nonce, email_verified.
 */
export async function exchangeCode(code: string, verifier: string, nonce: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token hatası: ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google kimlik belirteci yok");

  const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as {
    iss: string;
    aud: string;
    exp: number;
    nonce?: string;
    sub: string;
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
  };
  const issOk = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  if (!issOk || payload.aud !== CLIENT_ID || payload.exp * 1000 < Date.now() || payload.nonce !== nonce) {
    throw new Error("Google kimlik belirteci doğrulanamadı");
  }
  if (!payload.email || !payload.email_verified) throw new Error("Google e-postası doğrulanmamış");

  const [first, ...rest] = (payload.name ?? "").split(" ");
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    givenName: payload.given_name ?? first ?? "",
    familyName: payload.family_name ?? rest.join(" "),
  };
}
