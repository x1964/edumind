import { PageHeader } from "@/components/ui/page-header";
import { PlannerBoard } from "@/components/planner/planner-board";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StudyTask } from "@/lib/types";

export const instant = false;

export default async function StudyPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: taskRows }, { data: materialRows }] = await Promise.all([
    supabase
      .from("study_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(300),
    supabase
      .from("materials")
      .select("id, file_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title={dict.planner.title} description={dict.planner.subtitle} />
      <PlannerBoard
        tasks={(taskRows ?? []) as StudyTask[]}
        materials={(materialRows ?? []) as Array<{ id: string; file_name: string }>}
        dict={dict}
        lang={lang}
        defaultOpen={params.create === "1"}
      />
    </div>
  );
}
