"use client";

import { useActionState } from "react";
import { changePassword, type FormState } from "@/actions/auth";
import { Alert, Field, SubmitButton } from "@/components/forms";
import { PasswordField } from "@/components/PasswordField";

export function PasswordForm({ forced = false }: { forced?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <Field
        label={forced ? "Geçici şifre" : "Mevcut şifre"}
        name="current"
        type="password"
        autoComplete="current-password"
        error={f.current}
      />
      <PasswordField label="Yeni şifre" name="password" error={f.password} />
      <PasswordField label="Yeni şifre (tekrar)" name="password2" error={f.password2} showRules={false} />
      <SubmitButton pendingText="Kaydediliyor…">Şifreyi Kaydet</SubmitButton>
    </form>
  );
}
