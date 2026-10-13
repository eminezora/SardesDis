"use client";

import { useActionState } from "react";
import { resetPatientPassword, type StaffActionState } from "@/actions/staff";
import { SubmitButton } from "@/components/forms";

export function ResetPassword({ id }: { id: number }) {
  const [state, action] = useActionState<StaffActionState, FormData>(resetPatientPassword, {});
  if (state.tempPassword) {
    return (
      <p role="status" className="text-sm text-ink">
        Geçici şifre: <code className="rounded-[2px] bg-stone px-2 py-1 font-mono text-base">{state.tempPassword}</code>
        <span className="mt-1 block text-muted">Hastaya telefonda iletin. İlk girişte yeni şifre belirleyecek.</span>
      </p>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Bu hasta için geçici şifre oluşturulsun mu? Mevcut şifresi geçersiz olacak.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="outline" pendingText="…" className="!min-h-10 !px-4 text-sm">
        Geçici şifre oluştur
      </SubmitButton>
      {state.error && <p role="alert" className="mt-1 text-sm text-[#9b3b2f]">{state.error}</p>}
    </form>
  );
}
