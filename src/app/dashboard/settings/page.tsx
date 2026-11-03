import { PageHeader } from "@/components/ui/page-header";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export const instant = false;

export default async function SettingsPage() {
  const { dict, lang } = await getAppMessages();
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const fallback: Profile = {
    id: user.id,
    full_name: user.email?.split("@")[0] ?? "",
    avatar_url: null,
    education_level: null,
    learning_interests: [],
    learning_goals: [],
    learning_language: lang,
    theme: "dark",
    notifications: {},
    onboarding_completed: true,
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: user.updated_at ?? new Date().toISOString(),
  };

  const profile = { ...fallback, ...(data ?? {}) } as Profile;

  return (
    <div className="space-y-5">
      <PageHeader title={dict.settings.title} description={dict.settings.subtitle} />
      <SettingsClient
        dict={dict}
        initial={profile}
        email={user.email ?? ""}
        memberSince={formatDate(profile.created_at, lang)}
      />
    </div>
  );
}
