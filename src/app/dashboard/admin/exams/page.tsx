import { ShieldAlert } from "lucide-react";
import { AdminExamManager, type ArchiveRow } from "@/components/exams/admin-exam-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/learning/queries";
import { isCurrentUserAdmin } from "@/lib/supabase/roles";

export const instant = false;

export default async function AdminExamsPage() {
  const { dict, lang } = await getAppMessages();
  const admin = await isCurrentUserAdmin();

  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHeader title={dict.learn.adminTitle} description={dict.learn.adminSubtitle} />
        <EmptyState
          icon={<ShieldAlert className="size-5" />}
          title={dict.learn.noAdminAccess}
          description={dict.learn.adminOnly}
        />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: archiveRows }, catalog] = await Promise.all([
    supabase
      .from("exam_archives")
      .select(
        "id, title_ar, title_en, academic_year, exam_type, subject_id, verification_status, published, exam_archive_questions(id)"
      )
      .order("created_at", { ascending: false })
      .limit(100),
    getCatalog(),
  ]);

  const archives: ArchiveRow[] = (
    (archiveRows ?? []) as unknown as Array<{
      id: string;
      title_ar: string;
      title_en: string;
      academic_year: string;
      exam_type: string;
      subject_id: string | null;
      verification_status: "unverified" | "verified" | "rejected";
      published: boolean;
      exam_archive_questions?: Array<{ id: string }>;
    }>
  ).map((row) => ({
    id: row.id,
    title_ar: row.title_ar,
    title_en: row.title_en,
    academic_year: row.academic_year,
    exam_type: row.exam_type,
    subject_id: row.subject_id,
    verification_status: row.verification_status,
    published: row.published,
    questionCount: row.exam_archive_questions?.length ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={dict.learn.adminTitle} description={dict.learn.adminSubtitle} />
      <AdminExamManager
        dict={dict}
        lang={lang}
        archives={archives}
        subjects={catalog.subjects}
        grades={catalog.grades}
      />
    </div>
  );
}
