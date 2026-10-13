import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Hasta dosyaları (röntgen, rapor, fotoğraf…) `public/` DIŞINDA saklanır ve
 * yalnızca yetkili personel oturumuyla, `/api/kayitlar/[id]` üzerinden açılır.
 * Diskte özgün dosya adı kullanılmaz; rastgele bir anahtar kullanılır.
 */
const ROOT = process.env.FILES_PATH ?? path.join(process.cwd(), "data", "files");

export const MAX_FILE_BYTES = 30 * 1024 * 1024;

export type AllowedType = { mime: string; ext: string; inline: boolean; label: string };

/** Dosya türü, uzantıya değil içeriğin ilk baytlarına bakılarak belirlenir */
export function sniffType(buf: Buffer): AllowedType | null {
  const s = (a: number, b: number) => buf.subarray(a, b).toString("latin1");
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg", inline: true, label: "JPEG" };
  if (s(0, 8) === "\x89PNG\r\n\x1a\n") return { mime: "image/png", ext: "png", inline: true, label: "PNG" };
  if (s(0, 4) === "RIFF" && s(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp", inline: true, label: "WebP" };
  if (s(0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf", inline: true, label: "PDF" };
  if (buf.length > 132 && s(128, 132) === "DICM") return { mime: "application/dicom", ext: "dcm", inline: false, label: "DICOM" };
  return null;
}

function fullPath(key: string) {
  if (!/^[a-f0-9]{32}$/.test(key)) throw new Error("Geçersiz dosya anahtarı");
  // Çalışma anında belirlenen veri klasörü; derleme izlemesine dahil edilmez
  return path.join(/*turbopackIgnore: true*/ ROOT, key.slice(0, 2), key);
}

export async function saveFile(buf: Buffer): Promise<string> {
  const key = randomBytes(16).toString("hex");
  const p = fullPath(key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, buf, { flag: "wx", mode: 0o600 });
  return key;
}

export async function loadFile(key: string): Promise<Buffer> {
  return readFile(/*turbopackIgnore: true*/ fullPath(key));
}
