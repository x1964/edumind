import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudentFeed } from "@/components/dashboard/student-feed";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentProfile } from "@/lib/supabase/auth";

export const instant = false;
export const metadata: Metadata = {
  title: "Student Feed · EduMind",
  robots: { index: false, follow: false },
};

export default async function StudentFeedPage() {
  const [{ lang }, profile] = await Promise.all([getAppMessages(), getCurrentProfile()]);
  if (!profile) redirect("/login?next=/dashboard/feed");
  return (
    <StudentFeed
      lang={lang}
      userId={profile.id}
      fullName={profile.fullName}
      avatarUrl={profile.avatarUrl}
    />
  );
}
