"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import {
  academicProfileSchema,
  planItemRescheduleSchema,
  studentSubjectsSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";
import { generateQuiz } from "@/lib/ai/services";
import { AiNotConfiguredError, AiProviderError, isAiConfigured } from "@/lib/ai/provider";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { getDueRevisions, getPlannerSubjects } from "@/lib/learning/queries";
import { generateStudyPlan, generateSubjectPlan, toDateKey } from "@/lib/learning/planner";
import type { Lang } from "@/lib/i18n";
import type { AppMessages } from "@/lib/i18n/app";

function revalidateLearning() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/study-plan");
  revalidatePath("/dashboard/academic-profile");
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/exams");
}

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

export async function saveAcademicProfileAction(input: {
  systemId: string | null;
  stageId: string | null;
  gradeId: string | null;
  trackId: string | null;
  academicYear: string | null;
  dailyMinutes: number;
  preferredStartMinute: number;
  studyDays: number[];
  goals: string | null;
  completed: boolean;
}): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = academicProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };
  const data = parsed.data;

  // The catalog is public, but reject ids that do not exist or do not belong
  // to the selected parent. This prevents dangling profile rows.
  const supabase = await createSupabaseServerClient();
  if (data.gradeId) {
    const { data: grade } = await supabase
      .from("grade_levels")
      .select("id")
      .eq("id", data.gradeId)
      .maybeSingle();
    if (!grade) return { ok: false, error: dict.errors.invalidInput };
  }
  if (data.trackId) {
    const { data: track } = await supabase
      .from("academic_tracks")
      .select("id, grade_id")
      .eq("id", data.trackId)
      .maybeSingle();
    if (!track || (data.gradeId && track.grade_id !== data.gradeId)) {
      return { ok: false, error: dict.errors.invalidInput };
    }
  }

  const { error } = await supabase.from("student_profiles").upsert(
    {
      user_id: user.id,
      system_id: data.systemId,
      stage_id: data.stageId,
      grade_id: data.gradeId,
      track_id: data.trackId,
      academic_year: data.academicYear,
      daily_minutes: data.dailyMinutes,
      preferred_start_minute: data.preferredStartMinute,
      study_days: data.studyDays,
      goals: data.goals,
      onboarding_completed: data.completed,
    },
    { onConflict: "user_id" }
  );

  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidateLearning();
  return { ok: true, message: dict.learn.profileSaved };
}

export async function saveStudentSubjectsAction(
  input: Array<{ subjectId: string; examDate: string | null; priority: "low" | "medium" | "high" }>
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = studentSubjectsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();

  if (parsed.data.length > 0) {
    const ids = parsed.data.map((row) => row.subjectId);
    const { data: valid } = await supabase.from("subjects").select("id").in("id", ids);
    const validIds = new Set(((valid ?? []) as Array<{ id: string }>).map((row) => row.id));
    if (ids.some((id) => !validIds.has(id))) {
      return { ok: false, error: dict.errors.invalidInput };
    }
  }

  const { error: clearError } = await supabase
    .from("student_subjects")
    .delete()
    .eq("user_id", user.id);
  if (clearError) return { ok: false, error: dict.errors.saveFailed };

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("student_subjects").insert(
      parsed.data.map((row) => ({
        user_id: user.id,
        subject_id: row.subjectId,
        exam_date: row.examDate,
        priority: row.priority,
      }))
    );
    if (error) return { ok: false, error: dict.errors.saveFailed };
  }

  revalidateLearning();
  return { ok: true, message: dict.learn.subjectsSaved };
}

export async function generateStudyPlanAction(): Promise<ActionResult> {
  const { dict, lang } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return { ok: false, error: dict.learn.needsProfile };

  const [subjects, revisions] = await Promise.all([
    getPlannerSubjects(user.id, lang as Lang),
    getDueRevisions(user.id),
  ]);

  if (subjects.length === 0) return { ok: false, error: dict.learn.needsSubjects };

  const hasCurriculum = subjects.some((subject) => subject.lessons.length > 0);
  const planInput = {
    startDate: new Date(),
    dailyMinutes: Number(profile.daily_minutes ?? 120),
    studyDays: (profile.study_days as number[]) ?? [0, 1, 2, 3, 4, 6],
    subjects,
    revisions,
  };
  const subjectLabels = {
    studyTitle: (name: string) => (lang === "ar" ? `مذاكرة ${name}` : `Study ${name}`),
    reviseTitle: (name: string) => (lang === "ar" ? `مراجعة ${name}` : `Revise ${name}`),
    studyObjective: (name: string) =>
      lang === "ar"
        ? `راجع مادة ${name} من موادك المرفوعة ولخّص الأفكار الأساسية.`
        : `Study ${name} from your uploaded materials and summarise the key ideas.`,
    reviseObjective: (name: string) =>
      lang === "ar"
        ? `ثبّت ما تعلمته في ${name} قبل الاختبار.`
        : `Consolidate what you learned in ${name} before the exam.`,
    studyActivity:
      lang === "ar"
        ? "اقرأ جزءاً من المادة، لخّصه بأسلوبك، ثم اختبر نفسك بثلاثة أسئلة."
        : "Read part of the material, summarise it in your own words, then test yourself with three questions.",
    reviseActivity:
      lang === "ar"
        ? "مراجعة نشطة: اكتب ما تتذكره، ثم راجع نقاط الضعف وحل اختباراً قصيراً."
        : "Active recall: write what you remember, review weak points, then take a short assessment.",
  };

  // A student may have selected subjects but no curriculum lessons are
  // published yet. Fall back to honest subject-level sessions instead of
  // blocking the planner or inventing a curriculum.
  const result = hasCurriculum ? generateStudyPlan(planInput) : null;
  const finalResult =
    result && result.items.length > 0 ? result : generateSubjectPlan(planInput, subjectLabels);

  if (finalResult.items.length === 0) return { ok: false, error: dict.learn.planEmpty };

  // Archive the previous plan. Pending items become "missed" so adaptation is
  // visible instead of silently deleting the student's history.
  const { data: previousPlans } = await supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");
  const previousIds = ((previousPlans ?? []) as Array<{ id: string }>).map((row) => row.id);

  if (previousIds.length > 0) {
    await supabase
      .from("study_plan_items")
      .update({ status: "missed" })
      .in("plan_id", previousIds)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lt("planned_date", toDateKey(new Date()));
    await supabase
      .from("study_plans")
      .update({ status: "archived" })
      .in("id", previousIds)
      .eq("user_id", user.id);
  }

  const { data: plan, error: planError } = await supabase
    .from("study_plans")
    .insert({
      user_id: user.id,
      title:
        lang === "ar"
          ? `خطة المذاكرة — ${new Intl.DateTimeFormat("ar-EG", { month: "long" }).format(new Date())}`
          : `Study plan — ${new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date())}`,
      start_date: toDateKey(new Date()),
      end_date: finalResult.endDate,
      generator_version: 2,
      status: "active",
      notes: JSON.stringify(finalResult.summary),
    })
    .select("id")
    .single();

  if (planError || !plan) return { ok: false, error: dict.errors.saveFailed };

  const { error: itemsError } = await supabase.from("study_plan_items").insert(
    finalResult.items.map((item) => ({
      plan_id: plan.id,
      user_id: user.id,
      subject_id: item.subjectId,
      lesson_id: item.lessonId,
      title: item.title,
      learning_objective: item.learningObjective,
      recommended_activity: item.recommendedActivity,
      planned_date: item.plannedDate,
      duration_minutes: item.durationMinutes,
      priority: item.priority,
      kind: item.kind,
      sort_order: item.sortOrder,
      source: "generated",
    }))
  );

  if (itemsError) {
    await supabase.from("study_plans").delete().eq("id", plan.id).eq("user_id", user.id);
    return { ok: false, error: dict.errors.saveFailed };
  }

  revalidateLearning();
  return {
    ok: true,
    id: plan.id as string,
    message: dict.learn.planGenerated,
  };
}

export async function completePlanItemAction(itemId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("complete_plan_item", { p_item_id: itemId });
  if (error || !data) return { ok: false, error: dict.errors.saveFailed };

  revalidateLearning();
  return { ok: true, message: dict.learn.itemCompleted };
}

export async function reschedulePlanItemAction(
  itemId: string,
  plannedDate: string
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = planItemRescheduleSchema.safeParse({ itemId, plannedDate });
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${parsed.data.plannedDate}T00:00:00`);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);
  if (Number.isNaN(target.getTime()) || target < today || target > maxDate) {
    return { ok: false, error: dict.errors.invalidInput };
  }

  const supabase = await createSupabaseServerClient();
  const { data: item } = await supabase
    .from("study_plan_items")
    .select("id, reschedule_count, status")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) return { ok: false, error: dict.errors.notFound };
  if (item.reschedule_count >= 3) return { ok: false, error: dict.learn.rescheduleLimit };

  const { error } = await supabase
    .from("study_plan_items")
    .update({
      planned_date: parsed.data.plannedDate,
      status: "rescheduled",
      reschedule_count: (item.reschedule_count as number) + 1,
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidateLearning();
  return { ok: true, message: dict.learn.rescheduled };
}

export async function skipPlanItemAction(itemId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("study_plan_items")
    .update({ status: "skipped" })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .neq("status", "completed");

  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidateLearning();
  return { ok: true, message: dict.learn.skipped };
}

export async function generateLessonAssessmentAction(lessonId: string): Promise<ActionResult> {
  const { dict, lang } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };
  if (!isAiConfigured()) return { ok: false, error: dict.errors.aiNotConfigured };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const limit = await checkRateLimit(`ai:${user.id}`, AI_RATE_LIMIT.limit, AI_RATE_LIMIT.windowMs);
  if (!limit.allowed) return { ok: false, error: dict.errors.rateLimited };

  const supabase = await createSupabaseServerClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, title_ar, title_en, description_ar, description_en, content, difficulty, unit_id, curriculum_units(subject_id)"
    )
    .eq("id", lessonId)
    .eq("published", true)
    .maybeSingle();

  if (!lesson) return { ok: false, error: dict.errors.notFound };

  const unit = Array.isArray(lesson.curriculum_units)
    ? lesson.curriculum_units[0]
    : lesson.curriculum_units;
  const subjectId = (unit?.subject_id as string | null) ?? null;

  const { data: objectives } = await supabase
    .from("lesson_objectives")
    .select("text_ar, text_en")
    .eq("lesson_id", lessonId)
    .order("position");

  const title = lang === "ar" ? lesson.title_ar : lesson.title_en;
  const description = lang === "ar" ? (lesson.description_ar ?? "") : (lesson.description_en ?? "");

  const context = [
    title,
    description,
    ...((objectives ?? []) as Array<{ text_ar: string; text_en: string }>).map((row) =>
      lang === "ar" ? row.text_ar : row.text_en
    ),
    typeof lesson.content === "string" ? lesson.content : "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 14_000);

  if (context.trim().length < 120) {
    return { ok: false, error: dict.learn.lessonNoContent };
  }

  try {
    const output = await generateQuiz(
      lang as Lang,
      lesson.difficulty === "easy" || lesson.difficulty === "hard" ? lesson.difficulty : "medium",
      8,
      context
    );
    if (output.questions.length === 0) return { ok: false, error: dict.learn.assessmentFailed };

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        material_id: null,
        subject_id: subjectId,
        lesson_id: lessonId,
        title: output.title,
        difficulty: lesson.difficulty,
        source: "practice",
        assessment_kind: "topic_quiz",
        time_limit_minutes: 10,
      })
      .select("id")
      .single();

    if (quizError || !quiz) return { ok: false, error: dict.errors.saveFailed };

    const { data: inserted, error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(
        output.questions.map((question, index) => ({
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
          lesson_id: lessonId,
          topic: title,
          difficulty: lesson.difficulty,
        }))
      )
      .select("id, position");

    if (questionsError || !inserted) {
      await supabase.from("quizzes").delete().eq("id", quiz.id).eq("user_id", user.id);
      return { ok: false, error: dict.errors.saveFailed };
    }

    const { error: keysError } = await supabase.from("quiz_question_keys").insert(
      inserted.map((row) => {
        const source = output.questions[(row.position as number) - 1];
        return {
          question_id: row.id as string,
          quiz_id: quiz.id as string,
          user_id: user.id,
          correct_answer: source.correctAnswer,
          explanation: source.explanation || null,
        };
      })
    );

    if (keysError) {
      await supabase.from("quizzes").delete().eq("id", quiz.id).eq("user_id", user.id);
      return { ok: false, error: dict.errors.saveFailed };
    }

    revalidateLearning();
    return {
      ok: true,
      id: quiz.id as string,
      message: dict.learn.assessmentGenerated,
    };
  } catch (error) {
    return { ok: false, error: aiErrorMessage(error, dict) };
  }
}
