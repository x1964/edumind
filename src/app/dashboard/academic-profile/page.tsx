import { AcademicProfileForm } from "@/components/learning/academic-profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getAcademicProfile, getCatalog, getStudentSubjects } from "@/lib/learning/queries";

export const instant = false;

export default async function AcademicProfilePage() {
  const { dict, lang } = await getAppMessages();
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, catalog, subjects] = await Promise.all([
    getAcademicProfile(user.id),
    getCatalog(),
    getStudentSubjects(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={dict.learn.profileTitle} description={dict.learn.profileBody} />
      <AcademicProfileForm
        dict={dict}
        lang={lang}
        catalog={catalog}
        profile={profile}
        subjects={subjects}
      />
    </div>
  );
}
