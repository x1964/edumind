"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AppMessages } from "@/lib/i18n/app";

const initialState: AuthFormState = null;

export function ResetPasswordForm({ dict }: { dict: AppMessages }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">
          {dict.auth.resetTitle}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          {dict.auth.resetSubtitle}
        </p>
      </div>

      {state?.error ? <FormAlert tone="error">{state.error}</FormAlert> : null}
      {state?.success ? <FormAlert tone="success">{state.success}</FormAlert> : null}

      {state?.success ? (
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
        >
          {dict.auth.backToLogin}
        </Link>
      ) : (
        <form action={formAction} className="space-y-4">
          <PasswordField
            label={dict.auth.newPassword}
            showLabel={dict.auth.showPassword}
            hideLabel={dict.auth.hidePassword}
            name="password"
            autoComplete="new-password"
            hint={dict.auth.passwordHint}
          />
          <PasswordField
            label={dict.auth.confirmPassword}
            showLabel={dict.auth.showPassword}
            hideLabel={dict.auth.hidePassword}
            name="confirmPassword"
            autoComplete="new-password"
          />
          <SubmitButton pendingText={dict.auth.updating} className="h-10 w-full">
            {dict.auth.updatePassword}
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-[12.5px] text-ink-muted">
        <Link href="/login" className="font-medium text-brand-ink hover:opacity-80">
          {dict.auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}
