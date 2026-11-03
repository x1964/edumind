"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { quizAnswersSchema, mindMapSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

export async function updateSummaryAction(
  summaryId: string,
  input: { title: string; content: string }
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const title = input.title.trim().slice(0, 160);
  const content = input.content.trim().slice(0, 40_000);
  if (title.length < 2 || content.length < 20) {
    return { ok: false, error: dict.errors.invalidInput };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("summaries")
    .update({ title, content, edited: true })
    .eq("id", summaryId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidatePath("/dashboard/summaries");
  revalidatePath(`/dashboard/summaries/${summaryId}`);
  return { ok: true, message: dict.summaries.saved };
}

export async function deleteSummaryAction(summaryId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("summaries")
    .delete()
    .eq("id", summaryId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard/summaries");
  return { ok: true, message: dict.summaries.deleteSuccess };
}

export async function deleteQuizAction(quizId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId).eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard/quizzes");
  return { ok: true, message: dict.quizzes.deleteSuccess };
}

export async function submitQuizAction(
  quizId: string,
  answers: Record<string, string>
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsedAnswers = quizAnswersSchema.safeParse(answers);
  if (!parsedAnswers.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_quiz_id: quizId,
    p_answers: parsedAnswers.data,
  });

  if (error || !data) return { ok: false, error: dict.errors.saveFailed };

  revalidatePath("/dashboard/quizzes");
  revalidatePath(`/dashboard/quizzes/${quizId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  return {
    ok: true,
    id:
      typeof data === "object" && data && "attemptId" in data ? String(data.attemptId) : undefined,
    message: dict.quizzes.submitted,
  };
}

export async function saveMindMapAction(
  mindMapId: string,
  input: { title: string; nodes: unknown; edges: unknown }
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = mindMapSchema.safeParse({
    title: input.title,
    nodes: input.nodes,
    edges: input.edges,
  });
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("mind_maps")
    .update({
      title: parsed.data.title,
      nodes: parsed.data.nodes,
      edges: parsed.data.edges,
    })
    .eq("id", mindMapId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidatePath("/dashboard/mind-maps");
  revalidatePath(`/dashboard/mind-maps/${mindMapId}`);
  return { ok: true, message: dict.mindMaps.saved };
}

export async function deleteMindMapAction(mindMapId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("mind_maps")
    .delete()
    .eq("id", mindMapId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard/mind-maps");
  return { ok: true, message: dict.mindMaps.deleteSuccess };
}
