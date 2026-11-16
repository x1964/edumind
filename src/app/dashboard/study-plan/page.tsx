import { PlannerBoard } from "@/components/planner/planner-board";
import { PlanBoard } from "@/components/learning/plan-board";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActivePlan, getPlanItems } from "@/lib/learning/queries";
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

  const plan = await getActivePlan(user.id);
  const items = plan ? await getPlanItems(user.id, plan.id) : [];

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
    <div className="space-y-7">
      <PageHeader title={dict.planner.title} description={dict.planner.subtitle} />

      <PlanBoard dict={dict} lang={lang} plan={plan} items={items} />

      <section className="space-y-4 border-t border-hairline pt-6">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{dict.planner.allTasks}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">{dict.planner.subtitle}</p>
        </div>
        <PlannerBoard
          tasks={(taskRows ?? []) as StudyTask[]}
          materials={(materialRows ?? []) as Array<{ id: string; file_name: string }>}
          dict={dict}
          lang={lang}
          defaultOpen={params.create === "1"}
        />
      </section>
    </div>
  );
}
