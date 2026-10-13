import { NextResponse, type NextRequest } from "next/server";
import { googleEnabled, OAUTH_COOKIE, startParams } from "@/server/google";

export async function GET(req: NextRequest) {
  if (!googleEnabled) return NextResponse.redirect(new URL("/giris", req.url));
  const next = req.nextUrl.searchParams.get("sonra") ?? "";
  const { url, state, nonce, verifier } = startParams();

  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, Buffer.from(JSON.stringify({ state, nonce, verifier, next })).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
