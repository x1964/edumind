import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseSetupNotice } from "@/components/shared/setup-notice";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in · EduMind" };

// Signing in reads search params and the visitor's language cookie, so the
// route is allowed to block instead of pretending to be instant.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { dict } = await getAppMessages();
  const next = safeRedirectPath(params.next, "");

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

  return <LoginForm dict={dict} next={next || undefined} />;
}
