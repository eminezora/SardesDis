"use client";

import { useState } from "react";
import { SubmitButtonPlain } from "./SubmitButtonPlain";

const input =
  "mt-2 block w-full rounded-[2px] border border-stone-deep bg-paper px-4 py-3 text-base text-ink outline-none focus:border-forest";

/**
 * Dosya yükleme formu. Doğrudan /api/kayitlar uç noktasına gönderilir
 * (JS kapalıyken de çalışır); burada yalnızca boyut ön kontrolü yapılır.
 */
export function UploadForm({
  patientId,
  today,
  kinds,
  maxMb,
}: {
  patientId: number;
  today: string;
  kinds: { id: string; label: string }[];
  maxMb: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      action="/api/kayitlar"
      method="post"
      encType="multipart/form-data"
      className="space-y-5"
      onSubmit={(e) => {
        const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
        if (file && file.size > maxMb * 1024 * 1024) {
          e.preventDefault();
          setError(`Dosya en fazla ${maxMb} MB olabilir.`);
          return;
        }
        setError(null);
        setBusy(true);
      }}
    >
      <input type="hidden" name="patientId" value={patientId} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink">
          Tür
          <select name="kind" className={`${input} min-h-12`} defaultValue="xray">
            {kinds.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-ink">
          Tarih
          <input type="date" name="recordDate" defaultValue={today} className={`${input} min-h-12`} />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Başlık
        <input name="title" required maxLength={120} placeholder="Ör. Panoramik röntgen" className={`${input} min-h-12`} />
      </label>
      <label className="block text-sm font-medium text-ink">
        Açıklama <span className="font-normal text-muted">(isteğe bağlı)</span>
        <textarea name="body" rows={2} maxLength={4000} className={input} />
      </label>
      <label className="block text-sm font-medium text-ink">
        Dosya
        <input
          type="file"
          name="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf,.dcm,application/dicom"
          className="mt-2 block w-full text-sm text-muted file:mr-4 file:min-h-11 file:rounded-[2px] file:border file:border-ink/25 file:bg-paper file:px-4 file:text-ink"
        />
        <span className="mt-1.5 block text-sm font-normal text-muted">
          JPEG, PNG, WebP, PDF veya DICOM (.dcm) · en fazla {maxMb} MB
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-[#9b3b2f]">
          {error}
        </p>
      )}
      <SubmitButtonPlain busy={busy}>Yükle</SubmitButtonPlain>
    </form>
  );
}
