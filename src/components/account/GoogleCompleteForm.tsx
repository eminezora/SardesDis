"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/actions/auth";
import { completeGoogleSignup } from "@/actions/google";
import { Alert, Field, SubmitButton } from "@/components/forms";

export function GoogleCompleteForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [state, action] = useActionState<FormState, FormData>(completeGoogleSignup, {});
  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Ad" name="firstName" autoComplete="given-name" defaultValue={v.firstName ?? firstName} error={f.firstName} />
        <Field label="Soyad" name="lastName" autoComplete="family-name" defaultValue={v.lastName ?? lastName} error={f.lastName} />
      </div>
      <Field
        label="Cep telefonu"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={v.phone}
        error={f.phone}
        hint="Randevunuzla ilgili size ulaşabilmemiz için gereklidir."
      />
      <div>
        <label className="flex items-start gap-3 text-[0.9375rem] text-ink">
          <input type="checkbox" name="kvkk" className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-forest)]" aria-invalid={f.kvkk ? true : undefined} />
          <span>
            Kişisel verilerimin randevu işlemleri için işlenmesine ilişkin{" "}
            <Link href="/kvkk" target="_blank" className="underline decoration-gold underline-offset-4">
              aydınlatma metnini
            </Link>{" "}
            okudum ve onaylıyorum.
          </span>
        </label>
        {f.kvkk && <p className="mt-1.5 text-sm text-[#9b3b2f]">{f.kvkk}</p>}
      </div>
      <SubmitButton pendingText="Kaydediliyor…" className="w-full sm:w-auto">
        Kaydı Tamamla
      </SubmitButton>
    </form>
  );
}
