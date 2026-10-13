import { NextResponse, type NextRequest } from "next/server";
import { isValidDate, istanbulDate } from "@/lib/time";
import { getCurrentUser } from "@/server/auth";
import { MAX_FILE_BYTES, saveFile, sniffType } from "@/server/files";
import { addRecord, audit, isPatient, recordKinds, type RecordKind } from "@/server/records";

/**
 * Hasta dosyasına belge/görüntü yükleme (yalnızca personel).
 * Sunucu işlemlerinin 1 MB sınırını tüm site için büyütmemek adına ayrı
 * bir uç nokta kullanılır. Form, JS olmadan da çalışır (303 yönlendirme).
 */
export async function POST(req: NextRequest) {
  // Siteler arası istek sahteciliğine karşı köken kontrolü
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) {
    return new NextResponse("Geçersiz istek", { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "staff" || user.mustChangePassword) {
    return new NextResponse("Yetkisiz", { status: 401 });
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_FILE_BYTES + 64 * 1024) return back(req, null, "boyut");

  const form = await req.formData();
  const patientId = Number(form.get("patientId"));
  if (!Number.isInteger(patientId) || !isPatient(patientId)) {
    return new NextResponse("Hasta bulunamadı", { status: 404 });
  }

  const kind = String(form.get("kind")) as RecordKind;
  if (!recordKinds.some((k) => k.id === kind && k.file)) return back(req, patientId, "tur");
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  if (!title) return back(req, patientId, "baslik");
  const dateRaw = String(form.get("recordDate") ?? "");
  const recordDate = isValidDate(dateRaw) ? dateRaw : istanbulDate();
  const note = String(form.get("body") ?? "").trim().slice(0, 4000) || null;

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return back(req, patientId, "dosya");
  if (file.size > MAX_FILE_BYTES) return back(req, patientId, "boyut");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffType(buf);
  if (!type) return back(req, patientId, "bicim");

  const key = await saveFile(buf);
  const safeName = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || `dosya.${type.ext}`;
  const id = addRecord({
    patientId,
    kind,
    title,
    body: note,
    recordDate,
    createdBy: user.id,
    file: { key, name: safeName, mime: type.mime, size: buf.length },
  });
  audit(user.id, "record.create", { patientId, recordId: id });
  return back(req, patientId, null);
}

function back(req: NextRequest, patientId: number | null, error: string | null) {
  const path = patientId ? `/yonetim/hasta/${patientId}` : "/yonetim/hastalar";
  const url = new URL(path, req.url);
  url.searchParams.set(error ? "hata" : "eklendi", error ?? "1");
  url.hash = "kayitlar";
  return NextResponse.redirect(url, 303);
}
