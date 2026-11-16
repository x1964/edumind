"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isCurrentUserAdmin } from "@/lib/supabase/roles";
import { isAiConfigured, generateStructured, AiProviderError } from "@/lib/ai/provider";
import { examImportOutputSchema, examQuestionClassificationSchema } from "@/lib/ai/schemas";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/actions/types";

const archiveSchema = z.object({
  titleAr: z.string().trim().min(3).max(160),
  titleEn: z.string().trim().min(3).max(160),
  subjectId: z.string().uuid().nullable(),
  gradeId: z.string().uuid().nullable(),
  academicYear: z.string().trim().min(4).max(20),
  examType: z.enum(["final", "midterm", "mock", "official", "other"]),
  sourceReference: z.string().trim().max(500).nullable(),
});

const questionSchema = z.object({
  prompt: z.string().trim().min(5).max(2000),
  topic: z.string().trim().min(1).max(120),
  unitTitle: z.string().trim().max(160).optional().default(""),
  questionType: z.enum(["multiple_choice", "true_false", "short_answer", "essay", "matching"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  marks: z.coerce.number().int().min(1).max(100).default(1),
  lessonId: z.string().uuid().nullable().optional(),
});

const questionsSchema = z.array(questionSchema).min(1).max(100);

async function adminGuard() {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { error: dict.setup.body };
  const user = await getCurrentUser();
  if (!user) return { error: dict.errors.unauthorized };
  const admin = await isCurrentUserAdmin();
  if (!admin) return { error: dict.errors.forbidden };
  return { user, dict };
}

function revalidateExams() {
  revalidatePath("/dashboard/exams");
  revalidatePath("/dashboard/admin/exams");
  revalidatePath("/dashboard");
}

export async function createExamArchiveAction(input: {
  titleAr: string;
  titleEn: string;
  subjectId: string | null;
  gradeId: string | null;
  academicYear: string;
  examType: "final" | "midterm" | "mock" | "official" | "other";
  sourceReference: string | null;
}): Promise<ActionResult> {
  const gate = await adminGuard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict } = gate;

  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exam_archives")
    .insert({
      title_ar: parsed.data.titleAr,
      title_en: parsed.data.titleEn,
      subject_id: parsed.data.subjectId,
      grade_id: parsed.data.gradeId,
      academic_year: parsed.data.academicYear,
      exam_type: parsed.data.examType,
      source_reference: parsed.data.sourceReference,
      created_by: user.id,
      verification_status: "unverified",
      published: false,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: dict.errors.saveFailed };
  revalidateExams();
  return { ok: true, id: data.id as string, message: dict.learn.archiveCreated };
}

export async function addExamQuestionsAction(
  archiveId: string,
  input: Array<{
    prompt: string;
    topic: string;
    unitTitle?: string;
    questionType: "multiple_choice" | "true_false" | "short_answer" | "essay" | "matching";
    difficulty: "easy" | "medium" | "hard";
    marks?: number;
    lessonId?: string | null;
  }>
): Promise<ActionResult> {
  const gate = await adminGuard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { dict } = gate;

  if (!z.string().uuid().safeParse(archiveId).success) {
    return { ok: false, error: dict.errors.invalidInput };
  }
  const parsed = questionsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { data: archive } = await supabase
    .from("exam_archives")
    .select("id")
    .eq("id", archiveId)
    .maybeSingle();
  if (!archive) return { ok: false, error: dict.errors.notFound };

  const { count } = await supabase
    .from("exam_archive_questions")
    .select("id", { count: "exact", head: true })
    .eq("archive_id", archiveId);

  const { error } = await supabase.from("exam_archive_questions").insert(
    parsed.data.map((row, index) => ({
      archive_id: archiveId,
      prompt: row.prompt,
      topic: row.topic,
      unit_title: row.unitTitle || null,
      question_type: row.questionType,
      difficulty: row.difficulty,
      marks: row.marks,
      lesson_id: row.lessonId ?? null,
      position: (count ?? 0) + index + 1,
      ai_classified: false,
      admin_verified: true,
    }))
  );

  if (error) return { ok: false, error: dict.errors.saveFailed };
  revalidateExams();
  return { ok: true, message: dict.learn.questionsAdded };
}

export async function importExamQuestionsAction(
  archiveId: string,
  text: string
): Promise<ActionResult> {
  const gate = await adminGuard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict } = gate;
  if (!isAiConfigured()) return { ok: false, error: dict.errors.aiNotConfigured };

  if (!z.string().uuid().safeParse(archiveId).success) {
    return { ok: false, error: dict.errors.invalidInput };
  }
  const source = text.trim().slice(0, 20_000);
  if (source.length < 40) return { ok: false, error: dict.errors.invalidInput };

  const limit = await checkRateLimit(
    `exam-import:${user.id}`,
    AI_RATE_LIMIT.limit,
    AI_RATE_LIMIT.windowMs
  );
  if (!limit.allowed) return { ok: false, error: dict.errors.rateLimited };

  try {
    const output = await generateStructured(examImportOutputSchema, {
      system: `You extract examination questions from pasted official exam text.
Never invent questions that are not present in the text. Keep the original wording.
Classify each question with its curriculum topic, unit and type.
Return JSON: {"questions":[{"prompt":"...","topic":"...","unitTitle":"...","questionType":"multiple_choice|true_false|short_answer|essay|matching","difficulty":"easy|medium|hard","marks":1}]}`,
      prompt: `<exam_text>\n${source}\n</exam_text>`,
      maxTokens: 5000,
    });

    const supabase = await createSupabaseServerClient();
    const { data: archive } = await supabase
      .from("exam_archives")
      .select("id")
      .eq("id", archiveId)
      .maybeSingle();
    if (!archive) return { ok: false, error: dict.errors.notFound };

    const { count } = await supabase
      .from("exam_archive_questions")
      .select("id", { count: "exact", head: true })
      .eq("archive_id", archiveId);

    const { error } = await supabase.from("exam_archive_questions").insert(
      output.questions.map((row, index) => ({
        archive_id: archiveId,
        prompt: row.prompt,
        topic: row.topic,
        unit_title: row.unitTitle || null,
        question_type: row.questionType,
        difficulty: row.difficulty,
        marks: row.marks,
        position: (count ?? 0) + index + 1,
        ai_classified: true,
        admin_verified: false,
      }))
    );

    if (error) return { ok: false, error: dict.errors.saveFailed };
    revalidateExams();
    return { ok: true, message: dict.learn.questionsImported };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return {
        ok: false,
        error: error.status === 504 ? dict.errors.aiTimeout : dict.errors.aiBusy,
      };
    }
    return { ok: false, error: dict.errors.aiFailed };
  }
}

export async function classifyExamQuestionsAction(archiveId: string): Promise<ActionResult> {
  const gate = await adminGuard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { user, dict } = gate;
  if (!isAiConfigured()) return { ok: false, error: dict.errors.aiNotConfigured };

  const limit = await checkRateLimit(
    `exam-classify:${user.id}`,
    AI_RATE_LIMIT.limit,
    AI_RATE_LIMIT.windowMs
  );
  if (!limit.allowed) return { ok: false, error: dict.errors.rateLimited };

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("exam_archive_questions")
    .select("id, prompt, position, topic")
    .eq("archive_id", archiveId)
    .order("position")
    .limit(120);
  if (!rows || rows.length === 0) return { ok: false, error: dict.learn.noQuestions };

  try {
    const output = await generateStructured(examQuestionClassificationSchema, {
      system: `You classify examination questions by curriculum topic and difficulty.
Use short, consistent topic names (2-4 words). Never claim a topic exists if the question does not support it.
Return JSON: {"questions":[{"index":0,"topic":"...","unitTitle":"...","questionType":"multiple_choice","difficulty":"medium"}]}`,
      prompt: rows
        .map((row, index) => `${index}. ${row.prompt}`)
        .join("\n")
        .slice(0, 18_000),
      maxTokens: 3000,
    });

    const byIndex = new Map(output.questions.map((row) => [row.index, row]));
    for (const [index, row] of rows.entries()) {
      const classification = byIndex.get(index);
      if (!classification) continue;
      await supabase
        .from("exam_archive_questions")
        .update({
          topic: classification.topic,
          unit_title: classification.unitTitle || null,
          question_type: classification.questionType,
          difficulty: classification.difficulty,
          ai_classified: true,
          admin_verified: false,
        })
        .eq("id", row.id)
        .eq("archive_id", archiveId);
    }

    revalidateExams();
    return { ok: true, message: dict.learn.classificationDone };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return {
        ok: false,
        error: error.status === 504 ? dict.errors.aiTimeout : dict.errors.aiBusy,
      };
    }
    return { ok: false, error: dict.errors.aiFailed };
  }
}

export async function verifyExamQuestionsAction(archiveId: string): Promise<ActionResult> {
  const gate = await adminGuard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { dict } = gate;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("exam_archive_questions")
    .update({ admin_verified: true })
    .eq("archive_id", archiveId);
  if (error) return { ok: false, error: dict.errors.saveFailed };

  const { error: archiveError } = await supabase
    .from("exam_archives")
    .update({ verification_status: "verified" })
    .eq("id", archiveId);
  if (archiveError) return { ok: false, error: dict.errors.saveFailed };

  revalidateExams();
  return { ok: true, message: dict.learn.archiveVerified };
}

export async function publishExamArchiveAction(
  archiveId: string,
  published: boolean
): Promise<ActionResult> {
  const gate = await adminGuard();
  if ("error" in gate) return { ok: false, error: gate.error };
  const { dict } = gate;

  const supabase = await createSupabaseServerClient();
  const { data: archive } = await supabase
    .from("exam_archives")
    .select("id, verification_status")
    .eq("id", archiveId)
    .maybeSingle();
  if (!archive) return { ok: false, error: dict.errors.notFound };
  if (published && archive.verification_status !== "verified") {
    return { ok: false, error: dict.learn.verifyBeforePublish };
  }

  const { error } = await supabase.from("exam_archives").update({ published }).eq("id", archiveId);
  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidateExams();
  return { ok: true, message: dict.common.saved };
}
