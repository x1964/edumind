"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isAnalyticsEventName, type AnalyticsEventName } from "@/lib/analytics";
import { studyTaskSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

async function trackServerEvent(name: AnalyticsEventName): Promise<void> {
  if (!isAnalyticsEventName(name)) return;
  try {
    const { track } = await import("@vercel/analytics/server");
    await track(name);
  } catch {
    // Analytics must never break planner flows.
  }
}

interface TaskInput {
  title: string;
  description?: string;
  subject?: string;
  materialId?: string | null;
  dueDate?: string | null;
  priority?: string;
  estimatedMinutes?: number | null;
}

async function parseTask(
  input: TaskInput,
  dict: Awaited<ReturnType<typeof getAppMessages>>["dict"]
) {
  const parsed = studyTaskSchema.safeParse({
    title: input.title,
    description: input.description ?? "",
    subject: input.subject ?? "",
    materialId: input.materialId ?? null,
    dueDate: input.dueDate ?? null,
    priority: input.priority ?? "medium",
    estimatedMinutes: input.estimatedMinutes ?? null,
  });
  if (!parsed.success) return { error: dict.errors.invalidInput as string };
  return { data: parsed.data };
}

function revalidatePlanner() {
  revalidatePath("/dashboard/study-plan");
  revalidatePath("/dashboard");
}

export async function createTaskAction(input: TaskInput): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = await parseTask(input, dict);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const { data } = parsed;

  const supabase = await createSupabaseServerClient();

  if (data.materialId) {
    const { data: material } = await supabase
      .from("materials")
      .select("id")
      .eq("id", data.materialId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!material) return { ok: false, error: dict.materials.notFound };
  }

  const { data: row, error } = await supabase
    .from("study_tasks")
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      subject: data.subject || null,
      material_id: data.materialId ?? null,
      due_date: data.dueDate ?? null,
      priority: data.priority,
      estimated_minutes: data.estimatedMinutes ?? null,
    })
    .select("id")
    .single();

  if (error || !row) return { ok: false, error: dict.planner.failed };

  await trackServerEvent("study_task_created");

  revalidatePlanner();
  return { ok: true, id: row.id as string, message: dict.planner.success };
}

export async function updateTaskAction(taskId: string, input: TaskInput): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = await parseTask(input, dict);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const { data } = parsed;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("study_tasks")
    .update({
      title: data.title,
      description: data.description || null,
      subject: data.subject || null,
      material_id: data.materialId ?? null,
      due_date: data.dueDate ?? null,
      priority: data.priority,
      estimated_minutes: data.estimatedMinutes ?? null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.planner.failed };

  revalidatePlanner();
  return { ok: true, message: dict.planner.success };
}

export async function toggleTaskAction(taskId: string, completed: boolean): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("study_tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.planner.failed };

  if (completed) {
    await trackServerEvent("study_task_completed");
  }

  revalidatePlanner();
  return { ok: true, message: dict.planner.completedSuccess };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("study_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePlanner();
  return { ok: true, message: dict.planner.deleteSuccess };
}
