import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SupabaseSetupNotice } from "@/components/shared/setup-notice";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reset password · EduMind" };

export const instant = false;

export default async function ForgotPasswordPage() {
  const { dict } = await getAppMessages();

  if (!isSupabaseConfigured()) {
    return (
      <SupabaseSetupNotice
        title={dict.auth.configTitle}
        body={dict.auth.configBody}
        env={dict.setup.env}
        docs={dict.setup.docs}
      />
    );
  }

  return <ForgotPasswordForm dict={dict} />;
}
