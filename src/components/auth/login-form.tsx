"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { GoogleButton } from "@/components/auth/google-button";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import type { AppMessages } from "@/lib/i18n/app";

const initialState: AuthFormState = null;

export function LoginForm({
  dict,
  next,
  error,
}: {
  dict: AppMessages;
  next?: string;
  error?: string;
}) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
  const errorMessage = state?.error ?? error;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">
          {dict.auth.loginTitle}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          {dict.auth.loginSubtitle}
        </p>
      </div>

      {errorMessage ? <FormAlert tone="error">{errorMessage}</FormAlert> : null}

      <form action={formAction} className="space-y-4" noValidate={false}>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[13px] font-medium text-ink-soft">
            {dict.auth.email}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              dir="ltr"
              className="px-9"
            />
          </div>
        </div>

        <PasswordField
          label={dict.auth.password}
          showLabel={dict.auth.showPassword}
          hideLabel={dict.auth.hidePassword}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-soft">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="size-4 cursor-pointer appearance-none rounded-[5px] border border-hairline-strong bg-surface-deep checked:border-brand checked:bg-brand checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%2304130c%22 stroke-width=%222.2%22><path d=%22m3.5 8 3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat"
            />
            {dict.auth.remember}
          </label>
          <Link
            href="/forgot-password"
            className="text-[12.5px] font-medium text-brand-ink transition-opacity hover:opacity-80"
          >
            {dict.auth.forgot}
          </Link>
        </div>

        <SubmitButton pendingText={dict.auth.signingIn} className="h-10 w-full">
          {dict.auth.signIn}
        </SubmitButton>
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-wide text-ink-muted">
              {dict.auth.or}
            </span>
            <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
          </div>
          <GoogleButton
            label={dict.auth.google}
            redirectTo="/dashboard"
            errorLabel={dict.auth.genericError}
          />
        </>
      ) : null}

      <p className="text-center text-[12.5px] text-ink-muted">
        {dict.auth.noAccount}{" "}
        <Link href="/signup" className="font-medium text-brand-ink hover:opacity-80">
          {dict.auth.createAccount}
        </Link>
      </p>
    </div>
  );
}
