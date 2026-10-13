"use client";

import { useActionState } from "react";
import { deleteRecord, type RecordState } from "@/actions/records";
import { SubmitButton } from "@/components/forms";

export function DeleteRecord({ id }: { id: number }) {
  const [state, action] = useActionState<RecordState, FormData>(deleteRecord, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Bu kayıt silinsin mi? Silinen kayıt hasta dosyasında görünmez, denetim kaydında tutulur.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="danger" pendingText="…" className="!min-h-9 !px-3 text-xs">
        Sil
      </SubmitButton>
      {state.error && <p role="alert" className="mt-1 text-xs text-[#9b3b2f]">{state.error}</p>}
    </form>
  );
}
