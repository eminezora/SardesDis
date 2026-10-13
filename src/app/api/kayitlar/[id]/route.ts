import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { loadFile } from "@/server/files";
import { audit, getRecord } from "@/server/records";

/** Hasta dosyasını yalnızca personele, her açılışı kaydederek sunar */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/kayitlar/[id]">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "staff" || user.mustChangePassword) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }
  const { id } = await ctx.params;
  const record = getRecord(Number(id));
  if (!record?.file_key || !record.file_mime) return new NextResponse("Bulunamadı", { status: 404 });

  const buf = await loadFile(record.file_key);
  const download = req.nextUrl.searchParams.has("indir") || record.file_mime === "application/dicom";
  // Küçük önizlemeler (liste görünümü) her seferinde kayda yazılmaz; tam açılış yazılır
  if (!req.nextUrl.searchParams.has("onizleme")) {
    audit(user.id, "record.view", { patientId: record.patient_id, recordId: record.id });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": record.file_mime,
      "Content-Length": String(buf.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(record.file_name ?? "dosya")}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Görsellerde betik çalışmasını engelle (PDF görüntüleyici sandbox ile açılmadığı için hariç)
      ...(record.file_mime.startsWith("image/")
        ? { "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" }
        : {}),
      "Referrer-Policy": "no-referrer",
    },
  });
}
