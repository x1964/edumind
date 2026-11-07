"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { AiNotConfiguredError, AiProviderError, isAiConfigured } from "@/lib/ai/provider";
import { loadMaterialContext } from "@/lib/ai/context";
import {
  generateFlashcards,
  generateMindMap,
  generateQuiz,
  generateSummary,
} from "@/lib/ai/services";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { quizCountSchema, quizDifficultySchema, summaryStyleSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";

function aiErrorMessage(error: unknown, dict: AppMessages): string {
  if (error instanceof AiNotConfiguredError) return dict.errors.aiNotConfigured;
  if (error instanceof AiProviderError) {
    if (error.status === 429 || error.status === 503) return dict.errors.aiBusy;
    if (error.status === 504) return dict.errors.aiTimeout;
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return dict.errors.aiTimeout;
  }
  return dict.errors.aiFailed;
}

async function guard() {
  const { dict, lang } = await getAppMessages();
  if (!isSupabaseConfigured()) return { error: dict.setup.body };
  if (!isAiConfigured()) return { error: dict.errors.aiNotConfigured };
  const user = await getCurrentUser();
  if (!user) return { error: dict.errors.unauthorized };
  const limit = await checkRateLimit(`ai:${user.id}`, AI_RATE_LIMIT.limit, AI_RATE_LIMIT.windowMs);
  if (!limit.allowed) return { error: dict.errors.rateLimited };
  return { user, dict, lang };
}

export async function generateSummaryAction(
  materialId: string,
  style: string
): Promise<ActionResult> {
  const gate = await guard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict, lang } = gate;

  const parsedStyle = summaryStyleSchema.safeParse(style);
  if (!parsedStyle.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const context = await loadMaterialContext(supabase, user.id, materialId, "");
  if (!context) return { ok: false, error: dict.materials.notFound };
  if (!context.hasText) return { ok: false, error: dict.materials.textEmpty };

  try {
    const output = await generateSummary(lang as Lang, parsedStyle.data, context.text);
    const { data, error } = await supabase
      .from("summaries")
      .insert({
        user_id: user.id,
        material_id: materialId,
        style: parsedStyle.data,
        title: output.title,
        content: output.content,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: dict.errors.saveFailed };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/summaries");
    return { ok: true, id: data.id as string, message: dict.summaries.generated };
  } catch (error) {
    return {
      ok: false,
      error: aiErrorMessage(error, dict),
    };
  }
}

export async function generateQuizAction(
  materialId: string,
  difficulty: string,
  count: number
): Promise<ActionResult> {
  const gate = await guard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict, lang } = gate;

  const parsedDifficulty = quizDifficultySchema.safeParse(difficulty);
  if (!parsedDifficulty.success) return { ok: false, error: dict.errors.invalidInput };
  const parsedCount = quizCountSchema.safeParse(count);
  if (!parsedCount.success) return { ok: false, error: dict.errors.invalidInput };
  const questionCount = parsedCount.data;

  const supabase = await createSupabaseServerClient();
  const context = await loadMaterialContext(supabase, user.id, materialId, "");
  if (!context) return { ok: false, error: dict.materials.notFound };
  if (!context.hasText) return { ok: false, error: dict.materials.textEmpty };

  try {
    const output = await generateQuiz(
      lang as Lang,
      parsedDifficulty.data,
      questionCount,
      context.text
    );
    if (output.questions.length === 0) return { ok: false, error: dict.quizzes.failed };

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        material_id: materialId,
        title: output.title,
        difficulty: parsedDifficulty.data,
      })
      .select("id")
      .single();

    if (quizError || !quiz) return { ok: false, error: dict.errors.saveFailed };

    const rows = output.questions.map((question, index) => ({
      quiz_id: quiz.id,
      user_id: user.id,
      position: index + 1,
      type: question.type,
      prompt: question.prompt,
      options:
        question.type === "true_false"
          ? ["true", "false"]
          : question.type === "multiple_choice"
            ? question.options
            : null,
    }));

    const { data: inserted, error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(rows)
      .select("id, position");

    if (questionsError || !inserted) {
      await supabase.from("quizzes").delete().eq("id", quiz.id).eq("user_id", user.id);
      return { ok: false, error: dict.errors.saveFailed };
    }

    const keyRows = inserted.map((row) => {
      const source = output.questions[(row.position as number) - 1];
      return {
        question_id: row.id as string,
        quiz_id: quiz.id as string,
        user_id: user.id,
        correct_answer: source.correctAnswer,
        explanation: source.explanation || null,
      };
    });

    const { error: keysError } = await supabase.from("quiz_question_keys").insert(keyRows);
    if (keysError) {
      await supabase.from("quizzes").delete().eq("id", quiz.id).eq("user_id", user.id);
      return { ok: false, error: dict.errors.saveFailed };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    return { ok: true, id: quiz.id as string, message: dict.quizzes.generated };
  } catch (error) {
    return {
      ok: false,
      error: aiErrorMessage(error, dict),
    };
  }
}

export async function generateMindMapAction(materialId: string): Promise<ActionResult> {
  const gate = await guard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict, lang } = gate;

  const supabase = await createSupabaseServerClient();
  const context = await loadMaterialContext(supabase, user.id, materialId, "");
  if (!context) return { ok: false, error: dict.materials.notFound };
  if (!context.hasText) return { ok: false, error: dict.materials.textEmpty };

  try {
    const output = await generateMindMap(lang as Lang, context.text);
    const { data, error } = await supabase
      .from("mind_maps")
      .insert({
        user_id: user.id,
        material_id: materialId,
        title: output.title,
        nodes: output.nodes,
        edges: output.edges,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: dict.errors.saveFailed };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/mind-maps");
    return { ok: true, id: data.id as string, message: dict.mindMaps.generated };
  } catch (error) {
    return {
      ok: false,
      error: aiErrorMessage(error, dict),
    };
  }
}

export async function generateFlashcardsAction(materialId: string): Promise<ActionResult> {
  const gate = await guard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict, lang } = gate;

  const supabase = await createSupabaseServerClient();
  const context = await loadMaterialContext(supabase, user.id, materialId, "");
  if (!context) return { ok: false, error: dict.materials.notFound };
  if (!context.hasText) return { ok: false, error: dict.materials.textEmpty };

  try {
    const output = await generateFlashcards(lang as Lang, context.text);
    await supabase.from("flashcards").delete().eq("material_id", materialId).eq("user_id", user.id);

    const { error } = await supabase.from("flashcards").insert(
      output.cards.map((card, index) => ({
        user_id: user.id,
        material_id: materialId,
        front: card.front,
        back: card.back,
        position: index,
      }))
    );

    if (error) return { ok: false, error: dict.errors.saveFailed };

    revalidatePath(`/dashboard/materials/${materialId}`);
    return { ok: true, message: dict.materials.flashcardsGenerated };
  } catch (error) {
    return {
      ok: false,
      error: aiErrorMessage(error, dict),
    };
  }
}
