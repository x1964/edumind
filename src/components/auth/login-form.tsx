"use client";

import Link from "next/link";
import { GoogleButton } from "@/components/auth/google-button";
import { FormAlert } from "@/components/auth/form-alert";
import type { AppMessages } from "@/lib/i18n/app";

export function LoginForm({
  dict,
  next,
  error,
}: {
  dict: AppMessages;
  next?: string;
  error?: string;
}) {
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

      {error ? <FormAlert tone="error">{error}</FormAlert> : null}

      <GoogleButton
        label={dict.auth.google}
        redirectTo={next ?? "/dashboard"}
        errorLabel={dict.auth.genericError}
      />

      <p className="text-[12px] leading-relaxed text-ink-muted">{dict.auth.googleOnlyHint}</p>

      <p className="text-center text-[12.5px] text-ink-muted">
        {dict.auth.noAccount}{" "}
        <Link href="/signup" className="font-medium text-brand-ink hover:opacity-80">
          {dict.auth.createAccount}
        </Link>
      </p>
    </div>
  );
}
