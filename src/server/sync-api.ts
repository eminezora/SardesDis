import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { syncEnabled, validApiKey } from "./sync";

/** JSON yanıt; önbelleğe alınmaz (hasta verisi içerir) */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function apiError(status: number, code: string, message: string) {
  return json({ error: { code, message } }, status);
}

/**
 * Senkronizasyon uç noktalarını korur: SYNC_API_KEY tanımlı değilse API
 * tamamen kapalıdır (404); anahtar yanlışsa 401.
 */
export function withSyncAuth<C>(handler: (req: NextRequest, ctx: C) => Promise<Response> | Response) {
  return async (req: NextRequest, ctx: C) => {
    if (!syncEnabled) return apiError(404, "disabled", "Senkronizasyon API'si kapalı.");
    if (!validApiKey(req.headers.get("authorization"))) {
      return apiError(401, "unauthorized", "Geçersiz API anahtarı.");
    }
    return handler(req, ctx);
  };
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
