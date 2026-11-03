import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { SupabaseSetupNotice } from "@/components/shared/setup-notice";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create account · EduMind" };

// The auth shell is request-time (language cookie, session), so this screen is
// allowed to block navigation instead of being flagged as non-instant.
export const instant = false;

export default async function SignupPage() {
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

  return <SignupForm dict={dict} />;
}
