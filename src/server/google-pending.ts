import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { PENDING_COOKIE } from "./google";

export type Pending = {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  next: string;
};

/** Google ile gelip kaydını tamamlamamış ziyaretçinin bilgileri */
export async function readPending(): Promise<(Pending & { hash: string }) | null> {
  const token = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!token) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  const row = getDb()
    .prepare(
      "SELECT sub, email, given_name, family_name, next FROM google_pending WHERE token_hash = ? AND expires_at > ?",
    )
    .get(hash, Date.now()) as Pending | undefined;
  return row ? { ...row, hash } : null;
}

export async function clearPending(hash: string) {
  getDb().prepare("DELETE FROM google_pending WHERE token_hash = ?").run(hash);
  (await cookies()).delete(PENDING_COOKIE);
}
