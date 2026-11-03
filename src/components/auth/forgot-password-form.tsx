"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { forgotPasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { FormAlert } from "@/components/auth/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import type { AppMessages } from "@/lib/i18n/app";

const initialState: AuthFormState = null;

export function ForgotPasswordForm({ dict }: { dict: AppMessages }) {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-ink">
          {dict.auth.forgotTitle}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          {dict.auth.forgotSubtitle}
        </p>
      </div>

      {state?.error ? <FormAlert tone="error">{state.error}</FormAlert> : null}
      {state?.success ? <FormAlert tone="success">{state.success}</FormAlert> : null}

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="forgotEmail" className="block text-[13px] font-medium text-ink-soft">
            {dict.auth.email}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              id="forgotEmail"
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

        <SubmitButton pendingText={dict.auth.sending} className="h-10 w-full">
          {dict.auth.sendReset}
        </SubmitButton>
      </form>

      <p className="text-center text-[12.5px] text-ink-muted">
        <Link href="/login" className="font-medium text-brand-ink hover:opacity-80">
          {dict.auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}
