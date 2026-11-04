import { NextResponse } from "next/server";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isPushConfigured, sendPushToUser } from "@/lib/push/server";

interface DueTask {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured() || !isPushConfigured()) {
    return NextResponse.json({ error: "push_not_configured" }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("study_tasks")
    .select("id, user_id, title, due_date")
    .eq("completed", false)
    .gt("due_date", now.toISOString())
    .lte("due_date", windowEnd.toISOString())
    .order("due_date", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: "tasks_failed" }, { status: 500 });

  let sent = 0;
  for (const task of (data ?? []) as DueTask[]) {
    const { data: claim, error: claimError } = await supabase
      .from("push_task_reminders")
      .insert({
        task_id: task.id,
        user_id: task.user_id,
        due_date: task.due_date,
        kind: "one_hour",
      })
      .select("id")
      .maybeSingle();

    // A unique conflict means another cron invocation already claimed it.
    if (claimError || !claim) continue;

    await sendPushToUser(supabase, task.user_id, {
      title: "EduMind",
      body: `تذكير: تبدأ مهمة المذاكرة «${task.title}» خلال ساعة.`,
      url: "/dashboard/study-plan",
      tag: `study-task-${task.id}`,
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, checked: data?.length ?? 0, sent });
}
