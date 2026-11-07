import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAiConfigured, generateStructured } from "@/lib/ai/provider";
import { lessonPlanOutputSchema, teacherDailyReportOutputSchema } from "@/lib/ai/schemas";
import {
  lessonPlanSystemPrompt,
  lessonPlanUserPrompt,
  teacherDailyReportSystemPrompt,
} from "@/lib/ai/prompts";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";
import type { Lang } from "@/lib/i18n";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("lesson_plan"),
    lang: z.enum(["ar", "en"]).default("ar"),
    subject: z.string().trim().min(2).max(100),
    grade: z.string().trim().max(80).default(""),
    duration: z.number().int().min(10).max(240),
    topic: z.string().trim().min(2).max(240),
    context: z.string().trim().max(1600).optional(),
  }),
  z.object({
    action: z.literal("daily_report"),
    lang: z.enum(["ar", "en"]).default("ar"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
]);

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return Response.json({ error: "not_configured" }, { status: 503 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isAiConfigured()) return Response.json({ error: "ai_not_configured" }, { status: 503 });
  const roleClient = await createSupabaseServerClient();
  const [{ data: isTeacher }, { data: isAdmin }] = await Promise.all([
    roleClient.rpc("has_role", { p_role: "teacher" }),
    roleClient.rpc("has_role", { p_role: "admin" }),
  ]);
  if (isTeacher !== true && isAdmin !== true) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const limit = await checkRateLimit(
    `teacher-tools:${user.id}`,
    AI_RATE_LIMIT.limit,
    AI_RATE_LIMIT.windowMs
  );
  if (!limit.allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "invalid_body" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  if (parsed.data.action === "lesson_plan") {
    const input = parsed.data;
    const result = await generateStructured(lessonPlanOutputSchema, {
      system: lessonPlanSystemPrompt(input.lang as Lang),
      prompt: lessonPlanUserPrompt(input),
      maxTokens: 3000,
    });
    const { data, error } = await supabase
      .from("lesson_plans")
      .insert({
        teacher_id: user.id,
        title: result.title,
        subject: input.subject,
        grade_level: input.grade || null,
        duration_minutes: input.duration,
        objectives: result.objectives,
        activities: result.activities,
        assessment: result.assessment,
      })
      .select(
        "id, title, subject, grade_level, duration_minutes, objectives, activities, assessment, created_at"
      )
      .single();
    if (error) return Response.json({ error: "save_failed" }, { status: 500 });
    return Response.json({ plan: data });
  }

  const { data: activityRows } = await supabase
    .from("teacher_student_activity")
    .select(
      "student_id, activity_date, engagement_score, completion_rate, quiz_score, minutes_studied, notes, teacher_students(full_name)"
    )
    .eq("teacher_id", user.id)
    .eq("activity_date", parsed.data.date)
    .limit(500);
  const activity = (activityRows ?? []).map((row) => {
    const item = row as {
      student_id: string;
      activity_date: string;
      engagement_score: number | null;
      completion_rate: number | null;
      quiz_score: number | null;
      minutes_studied: number | null;
      notes: string | null;
      teacher_students?: { full_name: string } | Array<{ full_name: string }> | null;
    };
    const studentRelation = item.teacher_students;
    const studentName = Array.isArray(studentRelation)
      ? studentRelation[0]?.full_name
      : studentRelation?.full_name;
    return {
      student: studentName ?? "Student",
      engagement: item.engagement_score,
      completion: item.completion_rate,
      quizScore: item.quiz_score,
      minutesStudied: item.minutes_studied,
      notes: item.notes,
    };
  });
  const result = await generateStructured(teacherDailyReportOutputSchema, {
    system: teacherDailyReportSystemPrompt(parsed.data.lang as Lang),
    prompt: `Date: ${parsed.data.date}\nStudent activity records:\n${JSON.stringify(activity)}`,
    maxTokens: 2200,
  });
  const { data, error } = await supabase
    .from("teacher_daily_reports")
    .upsert(
      {
        teacher_id: user.id,
        report_date: parsed.data.date,
        summary: result.summary,
        highlights: result.highlights,
        risks: result.risks,
        recommendations: result.recommendations,
      },
      { onConflict: "teacher_id,report_date" }
    )
    .select("id, report_date, summary, highlights, risks, recommendations, created_at")
    .single();
  if (error) return Response.json({ error: "save_failed" }, { status: 500 });
  return Response.json({ report: data, activityCount: activity.length });
}
