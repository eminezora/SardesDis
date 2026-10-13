"use client";

import { useActionState, useEffect, useRef } from "react";
import { addNote, type RecordState } from "@/actions/records";
import { Alert, SubmitButton } from "@/components/forms";

const input =
  "mt-2 block w-full rounded-[2px] border border-stone-deep bg-paper px-4 py-3 text-base text-ink outline-none focus:border-forest";

export function NoteForm({ patientId, today }: { patientId: number; today: string }) {
  const [state, action] = useActionState<RecordState, FormData>(addNote, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <input type="hidden" name="patientId" value={patientId} />
      <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
        <label className="text-sm font-medium text-ink">
          Başlık
          <input name="title" required maxLength={120} placeholder="Ör. Kontrol muayenesi" className={`${input} min-h-12`} />
        </label>
        <label className="text-sm font-medium text-ink">
          Tarih
          <input type="date" name="recordDate" defaultValue={today} className={`${input} min-h-12`} />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Not
        <textarea name="body" required rows={5} maxLength={8000} className={input} />
      </label>
      <SubmitButton pendingText="Kaydediliyor…">Notu Kaydet</SubmitButton>
    </form>
  );
}
