"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail, UserRound } from "lucide-react";
import { signupAction, type AuthFormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/auth/form-alert";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import type { AppMessages } from "@/lib/i18n/app";

const initialState: AuthFormState = null;

export function SignupForm({ dict }: { dict: AppMessages }) {
  const [state, formAction] = useActionState(signupAction, initialState);
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

  if (state?.success) {
    return (
      <div className="space-y-5">
        <div className="grid size-12 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-ink">
          <Mail className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-ink">
            {dict.auth.checkEmail}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
            {dict.auth.checkEmailBody.replace("{email}", state.email ?? "")}
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
        >
          {dict.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">
          {dict.auth.signUpTitle}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          {dict.auth.signUpSubtitle}
        </p>
      </div>

      {state?.error ? <FormAlert tone="error">{state.error}</FormAlert> : null}

      {googleEnabled ? (
        <>
          <GoogleButton
            label={dict.auth.google}
            redirectTo="/onboarding"
            errorLabel={dict.auth.genericError}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-hairline" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-ink-muted">{dict.auth.or}</span>
            </div>
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-[13px] font-medium text-ink-soft">
            {dict.auth.fullName}
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              className="px-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signupEmail" className="block text-[13px] font-medium text-ink-soft">
            {dict.auth.email}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              id="signupEmail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              dir="auto"
              className="px-9"
            />
          </div>
        </div>

        <PasswordField
          label={dict.auth.password}
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

        <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-hairline-strong bg-surface-deep checked:border-brand checked:bg-brand checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%2304130c%22 stroke-width=%222.2%22><path d=%22m3.5 8 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
          />
          <span>{dict.auth.acceptTerms}</span>
        </label>

        <SubmitButton pendingText={dict.auth.signingUp} className="h-10 w-full">
          {dict.auth.signUp}
        </SubmitButton>
      </form>

      <p className="text-center text-[12.5px] text-ink-muted">
        {dict.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-brand-ink hover:opacity-80">
          {dict.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
