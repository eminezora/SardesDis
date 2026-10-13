"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/actions/auth";
import { Alert, Field, SubmitButton } from "@/components/forms";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field
        label="Cep telefonu veya e-posta"
        name="identifier"
        autoComplete="username"
        defaultValue={state.values?.identifier}
        hint="Kayıt olurken kullandığınız cep telefonu (05xx…) ya da e-posta."
      />
      <Field label="Şifre" name="password" type="password" autoComplete="current-password" />
      <SubmitButton pendingText="Giriş yapılıyor…" className="w-full sm:w-auto">
        Giriş Yap
      </SubmitButton>
    </form>
  );
}
