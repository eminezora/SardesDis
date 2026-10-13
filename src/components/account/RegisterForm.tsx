"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type FormState } from "@/actions/auth";
import { Alert, Field, SubmitButton } from "@/components/forms";
import { PasswordField } from "@/components/PasswordField";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(register, {});
  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && <Alert>{state.error}</Alert>}
      {Object.keys(f).length > 0 && <Alert>Lütfen işaretli alanları kontrol edin.</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Ad" name="firstName" autoComplete="given-name" defaultValue={v.firstName} error={f.firstName} />
        <Field label="Soyad" name="lastName" autoComplete="family-name" defaultValue={v.lastName} error={f.lastName} />
      </div>
      <Field
        label="Cep telefonu"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={v.phone}
        error={f.phone}
        hint="Giriş yaparken ve randevunuzla ilgili size ulaşmak için kullanılır."
      />
      <Field
        label="E-posta"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required={false}
        optionalLabel
        defaultValue={v.email}
        error={f.email}
      />
      <PasswordField label="Şifre" name="password" error={f.password} />
      <PasswordField label="Şifre (tekrar)" name="password2" error={f.password2} showRules={false} />

      <div>
        <label className="flex items-start gap-3 text-[0.9375rem] text-ink">
          <input
            type="checkbox"
            name="kvkk"
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-forest)]"
            aria-invalid={f.kvkk ? true : undefined}
            aria-describedby={f.kvkk ? "kvkk-err" : undefined}
          />
          <span>
            Kişisel verilerimin randevu işlemleri için işlenmesine ilişkin{" "}
            <Link href="/kvkk" target="_blank" className="text-forest underline decoration-gold underline-offset-4">
              aydınlatma metnini
            </Link>{" "}
            okudum ve onaylıyorum.
          </span>
        </label>
        {f.kvkk && (
          <p id="kvkk-err" className="mt-1.5 text-sm text-[#9b3b2f]">
            {f.kvkk}
          </p>
        )}
      </div>

      <SubmitButton pendingText="Hesap oluşturuluyor…" className="w-full sm:w-auto">
        Kayıt Ol
      </SubmitButton>
    </form>
  );
}
