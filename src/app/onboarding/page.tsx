import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/landing/Logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SupabaseSetupNotice } from "@/components/shared/setup-notice";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, hasCompleteAnswers } from "@/lib/supabase/auth";

export const instant = false;

export const metadata: Metadata = {
  title: "Get started · EduMind",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ revisit?: string }>;
}) {
  await connection();

  const { dict, lang } = await getAppMessages();
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface px-5 py-12">
        <SupabaseSetupNotice
          title={dict.setup.title}
          body={dict.setup.body}
          env={dict.setup.env}
          docs={dict.setup.docs}
        />
      </main>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "education_level, learning_interests, learning_goals, learning_language, onboarding_completed"
    )
    .eq("id", user.id)
    .maybeSingle();

  const answersComplete = profile ? hasCompleteAnswers(profile) : false;
  const completed = Boolean(profile?.onboarding_completed) || answersComplete;

  // Heal the stored flag when the answers are already complete, so the rest of
  // the app stops treating this account as unfinished.
  if (answersComplete && !profile?.onboarding_completed) {
    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  }

  if (completed && params.revisit !== "1") {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-surface">
      <div
        aria-hidden="true"
        className="em-grid-lines pointer-events-none absolute inset-0 opacity-25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-52 start-1/3 size-[38rem] rounded-full bg-brand/[0.06] blur-[130px]"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-7 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label={dict.common.appName}>
            <Logo />
          </Link>
          {completed ? (
            <Link
              href="/dashboard"
              className="text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {dict.common.backToDashboard}
            </Link>
          ) : null}
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <OnboardingFlow
            dict={dict}
            lang={lang}
            initial={{
              educationLevel: profile?.education_level ?? "",
              interests: profile?.learning_interests ?? [],
              goals: profile?.learning_goals ?? [],
              learningLanguage: profile?.learning_language === "en" ? "en" : lang,
            }}
          />
        </div>
      </div>
    </main>
  );
}
