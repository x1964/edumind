import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Toaster } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard · EduMind",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // The dashboard is entirely per-user: stop prerendering before reading the
  // session, so Supabase auth (which clocks the JWT) never runs during build.
  await connection();

  const { dict, lang } = await getAppMessages();

  if (!isSupabaseConfigured()) {
    redirect("/login?error=config");
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/dashboard");

  return (
    <DashboardShell
      dict={dict}
      lang={lang}
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      }}
    >
      {profile.onboardingCompleted ? null : (
        <div
          role="status"
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand-ink">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-ink">
                {dict.onboarding.incompleteBannerTitle}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
                {dict.onboarding.incompleteBannerBody}
              </p>
            </div>
          </div>
          <Link
            href="/onboarding?revisit=1"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
          >
            {dict.onboarding.incompleteBannerCta}
            <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      )}
      {children}
      <Toaster
        theme="light"
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--em-card)",
            border: "1px solid var(--em-border)",
            color: "var(--em-text)",
          },
        }}
      />
    </DashboardShell>
  );
}
