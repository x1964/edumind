import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormAlert } from "@/components/auth/form-alert";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Set a new password · EduMind" };

// Verifying the recovery session is request-time work.
export const instant = false;

export default async function ResetPasswordPage() {
  const { dict } = await getAppMessages();

  if (!isSupabaseConfigured()) {
    return (
      <FormAlert tone="error">
        {dict.auth.configBody}{" "}
        <Link href="/login" className="underline">
          {dict.auth.backToLogin}
        </Link>
      </FormAlert>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-4">
        <FormAlert tone="error">{dict.auth.resetSessionMissing}</FormAlert>
        <Link
          href="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-brand text-[13.5px] font-semibold text-[#04130c]"
        >
          {dict.auth.forgot}
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm dict={dict} />;
}
