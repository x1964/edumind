"use client";

import Link from "next/link";
import { GoogleButton } from "@/components/auth/google-button";
import type { AppMessages } from "@/lib/i18n/app";

export function SignupForm({ dict }: { dict: AppMessages }) {
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

      <GoogleButton
        label={dict.auth.google}
        redirectTo="/onboarding"
        errorLabel={dict.auth.genericError}
      />

      <p className="text-[12px] leading-relaxed text-ink-muted">{dict.auth.googleOnlyHint}</p>

      <p className="text-[12px] leading-relaxed text-ink-muted">{dict.auth.acceptTerms}</p>

      <p className="text-center text-[12.5px] text-ink-muted">
        {dict.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-brand-ink hover:opacity-80">
          {dict.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
