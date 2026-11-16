import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AcademicProfile, PlannerLesson, PlannerRevision, PlannerSubject } from "./planner";
import { daysUntil } from "./planner";

export type LocalizedPair = { ar: string; en: string };

export interface CatalogOption {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  parentId?: string | null;
}

export interface StudentSubject {
  id: string;
  subjectId: string;
  nameAr: string;
  nameEn: string;
  examDate: string | null;
  priority: "low" | "medium" | "high";
  lessonCount: number;
}

export interface PlanItemRow {
  id: string;
  plan_id: string;
  subject_id: string | null;
  lesson_id: string | null;
  title: string;
  learning_objective: string | null;
  recommended_activity: string | null;
  planned_date: string;
  duration_minutes: number;
  priority: "low" | "medium" | "high";
  kind: "learn" | "revise" | "assess";
  status: "pending" | "completed" | "missed" | "rescheduled" | "skipped";
  completed_at: string | null;
  sort_order: number;
}

export interface ActivePlan {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface WeakTopic {
  topic: string;
  attempts: number;
  incorrect: number;
  accuracy: number;
  subjectId: string | null;
}

export interface UpcomingExam {
  subjectId: string;
  nameAr: string;
  nameEn: string;
  examDate: string;
  daysLeft: number;
}

export interface Recommendation {
  id: string;
  kind: "lesson" | "revision" | "assessment" | "subject";
  title: string;
  reason: string;
  href: string;
  priority: number;
}

interface SubjectRow {
  id: string;
  name_ar: string;
  name_en: string;
  curriculum_units?: Array<{
    id: string;
    title_ar: string;
    title_en: string;
    position: number;
    lessons?: Array<{
      id: string;
      title_ar: string;
      title_en: string;
      description_ar: string | null;
      description_en: string | null;
      difficulty: "easy" | "medium" | "hard";
      estimated_minutes: number;
      position: number;
      lesson_objectives?: Array<{ text_ar: string; text_en: string; position: number }>;
    }>;
  }>;
}

interface StudentSubjectRow {
  id: string;
  subject_id: string;
  exam_date: string | null;
  priority: "low" | "medium" | "high";
  subjects: SubjectRow | SubjectRow[] | null;
}

export async function getAcademicProfile(userId: string): Promise<AcademicProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AcademicProfile;
}

export async function getCatalog(): Promise<{
  systems: CatalogOption[];
  stages: CatalogOption[];
  grades: CatalogOption[];
  tracks: CatalogOption[];
  subjects: CatalogOption[];
}> {
  const supabase = await createSupabaseServerClient();
  const [systems, stages, grades, tracks, subjects] = await Promise.all([
    supabase
      .from("educational_systems")
      .select("id, code, name_ar, name_en")
      .eq("published", true)
      .order("name_en"),
    supabase
      .from("academic_stages")
      .select("id, code, name_ar, name_en, system_id")
      .eq("published", true)
      .order("position"),
    supabase
      .from("grade_levels")
      .select("id, code, name_ar, name_en, stage_id")
      .eq("published", true)
      .order("position"),
    supabase
      .from("academic_tracks")
      .select("id, code, name_ar, name_en, grade_id")
      .eq("published", true)
      .order("position"),
    supabase
      .from("subjects")
      .select("id, code, name_ar, name_en, grade_id, track_id")
      .eq("published", true)
      .order("position"),
  ]);

  const map = (rows: unknown[] | null, parentKey?: string): CatalogOption[] =>
    ((rows ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      code: String(row.code),
      nameAr: String(row.name_ar),
      nameEn: String(row.name_en),
      parentId: parentKey && row[parentKey] ? String(row[parentKey]) : null,
    }));

  return {
    systems: map(systems.data),
    stages: map(stages.data, "system_id"),
    grades: map(grades.data, "stage_id"),
    tracks: map(tracks.data, "grade_id"),
    subjects: map(subjects.data, "grade_id"),
  };
}

export async function getStudentSubjects(userId: string): Promise<StudentSubject[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_subjects")
    .select("id, subject_id, exam_date, priority, subjects(name_ar, name_en)")
    .eq("user_id", userId)
    .order("created_at");

  if (error) return [];
  return ((data ?? []) as unknown as StudentSubjectRow[]).map((row) => {
    const subject = normalizeSubject(row.subjects);
    return {
      id: row.id,
      subjectId: row.subject_id,
      nameAr: subject?.name_ar ?? "",
      nameEn: subject?.name_en ?? "",
      examDate: row.exam_date,
      priority: row.priority,
      lessonCount: countLessons(subject),
    };
  });
}

function normalizeSubject(value: SubjectRow | SubjectRow[] | null): SubjectRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function countLessons(subject: SubjectRow | null): number {
  if (!subject?.curriculum_units) return 0;
  return subject.curriculum_units.reduce((sum, unit) => sum + (unit.lessons?.length ?? 0), 0);
}

export async function getPlannerSubjects(
  userId: string,
  lang: "ar" | "en"
): Promise<PlannerSubject[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_subjects")
    .select(
      `id, subject_id, exam_date, priority,
       subjects(
         id, name_ar, name_en,
         curriculum_units(
           id, title_ar, title_en, position,
           lessons(
             id, title_ar, title_en, description_ar, description_en, difficulty,
             estimated_minutes, position,
             lesson_objectives(text_ar, text_en, position)
           )
         )
       )`
    )
    .eq("user_id", userId)
    .order("created_at");

  if (error) return [];

  const rows = (data ?? []) as unknown as StudentSubjectRow[];
  const subjectIds = rows.map((row) => row.subject_id);
  const { data: progressRows } = subjectIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id, mastery, subject_id")
        .eq("user_id", userId)
        .limit(2000)
    : { data: [] };

  const masteryByLesson = new Map<string, number>();
  for (const row of (progressRows ?? []) as Array<{ lesson_id: string; mastery: number }>) {
    masteryByLesson.set(row.lesson_id, row.mastery);
  }

  return rows.map((row) => {
    const subject = normalizeSubject(row.subjects);
    const lessons: PlannerLesson[] = [];
    for (const unit of subject?.curriculum_units ?? []) {
      for (const lesson of unit.lessons ?? []) {
        const objective = lesson.lesson_objectives?.[0];
        lessons.push({
          id: lesson.id,
          title: lang === "ar" ? lesson.title_ar : lesson.title_en,
          objective: objective ? (lang === "ar" ? objective.text_ar : objective.text_en) : null,
          difficulty: lesson.difficulty,
          estimatedMinutes: lesson.estimated_minutes,
          mastery: masteryByLesson.get(lesson.id) ?? 0,
          position: unit.position * 1000 + lesson.position,
          unitTitle: lang === "ar" ? unit.title_ar : unit.title_en,
        });
      }
    }
    return {
      id: row.subject_id,
      name:
        (lang === "ar" ? subject?.name_ar : subject?.name_en) ||
        (subject?.name_en ?? subject?.name_ar ?? ""),
      examDate: row.exam_date,
      priority: row.priority,
      lessons,
    };
  });
}

export async function getDueRevisions(userId: string): Promise<PlannerRevision[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("revision_schedule")
    .select("id, lesson_id, subject_id, title, due_date, stage, interval_days")
    .eq("user_id", userId)
    .eq("status", "due")
    .order("due_date")
    .limit(120);

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    subjectId: row.subject_id ? String(row.subject_id) : null,
    title: String(row.title),
    dueDate: String(row.due_date),
    stage: Number(row.stage ?? 1),
    intervalDays: Number(row.interval_days ?? 1),
  }));
}

export async function getActivePlan(userId: string): Promise<ActivePlan | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("study_plans")
    .select("id, title, start_date, end_date, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ActivePlan | null) ?? null;
}

export async function getPlanItems(userId: string, planId: string): Promise<PlanItemRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("study_plan_items")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .order("planned_date")
    .order("sort_order")
    .limit(500);
  return (data ?? []) as PlanItemRow[];
}

export async function getTodayPlan(userId: string): Promise<{
  plan: ActivePlan | null;
  items: PlanItemRow[];
}> {
  const plan = await getActivePlan(userId);
  if (!plan) return { plan: null, items: [] };
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const { data } = await supabase
    .from("study_plan_items")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", plan.id)
    .eq("planned_date", key)
    .order("sort_order")
    .limit(40);
  return { plan, items: (data ?? []) as PlanItemRow[] };
}

export async function getUpcomingExams(userId: string): Promise<UpcomingExam[]> {
  const subjects = await getStudentSubjects(userId);
  const today = new Date();
  return subjects
    .filter((subject): subject is StudentSubject & { examDate: string } =>
      Boolean(subject.examDate)
    )
    .map((subject) => ({
      subjectId: subject.subjectId,
      nameAr: subject.nameAr,
      nameEn: subject.nameEn,
      examDate: subject.examDate,
      daysLeft: daysUntil(subject.examDate, today) ?? 0,
    }))
    .filter((exam) => exam.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
}

interface AttemptResultRow {
  results?: Array<{ topic?: string | null; isCorrect?: boolean }>;
  quiz_id: string;
}

export async function getWeakTopics(userId: string): Promise<WeakTopic[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, results")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(60);

  const stats = new Map<string, { attempts: number; incorrect: number }>();
  for (const row of (data ?? []) as AttemptResultRow[]) {
    for (const result of row.results ?? []) {
      const topic = (result.topic ?? "").trim();
      if (!topic) continue;
      const entry = stats.get(topic) ?? { attempts: 0, incorrect: 0 };
      entry.attempts += 1;
      if (!result.isCorrect) entry.incorrect += 1;
      stats.set(topic, entry);
    }
  }

  return [...stats.entries()]
    .map(([topic, value]) => ({
      topic,
      attempts: value.attempts,
      incorrect: value.incorrect,
      accuracy: Math.round(((value.attempts - value.incorrect) / value.attempts) * 100),
      subjectId: null,
    }))
    .filter((row) => row.incorrect > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 5);
}

export async function getLearningXp(userId: string): Promise<{
  xp: number;
  level: number;
  achievements: Array<{ code: string; unlockedAt: string }>;
}> {
  const supabase = await createSupabaseServerClient();
  const [{ data: xpRow }, { data: achievementRows }] = await Promise.all([
    supabase.from("student_xp").select("xp, level").eq("user_id", userId).maybeSingle(),
    supabase
      .from("student_achievements")
      .select("code, unlocked_at")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false })
      .limit(6),
  ]);
  return {
    xp: Number(xpRow?.xp ?? 0),
    level: Number(xpRow?.level ?? 1),
    achievements: ((achievementRows ?? []) as Array<{ code: string; unlocked_at: string }>).map(
      (row) => ({ code: row.code, unlockedAt: row.unlocked_at })
    ),
  };
}

export interface ExamInsight {
  archivesAnalyzed: number;
  years: string[];
  questions: number;
  topics: Array<{
    topic: string;
    questionCount: number;
    archives: number;
    share: number;
    types: string[];
    difficultyMix: { easy: number; medium: number; hard: number };
  }>;
  questionTypes: Array<{ type: string; count: number }>;
  subjectIds: string[];
  verifiedOnly: boolean;
}

export async function getExamInsights(userId: string): Promise<ExamInsight> {
  const supabase = await createSupabaseServerClient();
  const subjects = await getStudentSubjects(userId);
  const subjectIds = subjects.map((subject) => subject.subjectId);

  let query = supabase
    .from("exam_archives")
    .select(
      "id, academic_year, subject_id, exam_archive_questions(topic, question_type, difficulty)"
    )
    .eq("published", true)
    .eq("verification_status", "verified")
    .limit(200);

  if (subjectIds.length > 0) query = query.in("subject_id", subjectIds);

  const { data, error } = await query;
  if (error || !data) {
    return {
      archivesAnalyzed: 0,
      years: [],
      questions: 0,
      topics: [],
      questionTypes: [],
      subjectIds,
      verifiedOnly: true,
    };
  }

  interface ArchiveRow {
    id: string;
    academic_year: string;
    subject_id: string | null;
    exam_archive_questions?: Array<{ topic: string; question_type: string; difficulty: string }>;
  }

  const archives = data as unknown as ArchiveRow[];
  const questions = archives.flatMap((archive) =>
    (archive.exam_archive_questions ?? []).map((question) => ({
      ...question,
      archiveId: archive.id,
      year: archive.academic_year,
    }))
  );

  const topicMap = new Map<
    string,
    {
      questionCount: number;
      archives: Set<string>;
      types: Set<string>;
      easy: number;
      medium: number;
      hard: number;
    }
  >();
  const typeCounts = new Map<string, number>();

  for (const question of questions) {
    const entry = topicMap.get(question.topic) ?? {
      questionCount: 0,
      archives: new Set<string>(),
      types: new Set<string>(),
      easy: 0,
      medium: 0,
      hard: 0,
    };
    entry.questionCount += 1;
    entry.archives.add(question.archiveId);
    entry.types.add(question.question_type);
    if (question.difficulty === "easy") entry.easy += 1;
    else if (question.difficulty === "hard") entry.hard += 1;
    else entry.medium += 1;
    topicMap.set(question.topic, entry);
    typeCounts.set(question.question_type, (typeCounts.get(question.question_type) ?? 0) + 1);
  }

  const total = questions.length || 1;
  return {
    archivesAnalyzed: archives.length,
    years: [...new Set(archives.map((archive) => archive.academic_year))].sort(),
    questions: questions.length,
    topics: [...topicMap.entries()]
      .map(([topic, entry]) => ({
        topic,
        questionCount: entry.questionCount,
        archives: entry.archives.size,
        share: Math.round((entry.questionCount / total) * 100),
        types: [...entry.types],
        difficultyMix: { easy: entry.easy, medium: entry.medium, hard: entry.hard },
      }))
      .sort((a, b) => b.questionCount - a.questionCount)
      .slice(0, 12),
    questionTypes: [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    subjectIds,
    verifiedOnly: true,
  };
}

export async function getRecommendations(
  userId: string,
  lang: "ar" | "en"
): Promise<Recommendation[]> {
  const [weakTopics, revisions, exams] = await Promise.all([
    getWeakTopics(userId),
    getDueRevisions(userId),
    getUpcomingExams(userId),
  ]);

  const recommendations: Recommendation[] = [];

  for (const revision of revisions.slice(0, 2)) {
    recommendations.push({
      id: `revision-${revision.id}`,
      kind: "revision",
      title: revision.title,
      reason:
        lang === "ar"
          ? "حان موعد مراجعة هذا الدرس حسب جدول المراجعة المتباعدة."
          : "This lesson is due for spaced revision.",
      href: "/dashboard/study-plan#today",
      priority: 1,
    });
  }

  for (const topic of weakTopics.slice(0, 2)) {
    recommendations.push({
      id: `weak-${topic.topic}`,
      kind: "assessment",
      title: topic.topic,
      reason:
        lang === "ar"
          ? `دقة ${topic.accuracy}% في ${topic.attempts} أسئلة سابقة. راجع هذا الموضوع ثم أعد اختباراً قصيراً.`
          : `${topic.accuracy}% accuracy across ${topic.attempts} previous questions. Review it, then take a short assessment.`,
      href: "/dashboard/exams",
      priority: 1,
    });
  }

  for (const exam of exams.filter((row) => row.daysLeft <= 14).slice(0, 1)) {
    recommendations.push({
      id: `exam-${exam.subjectId}`,
      kind: "subject",
      title: lang === "ar" ? exam.nameAr : exam.nameEn,
      reason:
        lang === "ar"
          ? `الاختبار بعد ${exam.daysLeft} يوماً. خطة المراجعة ستخصص وقتاً أكبر لهذه المادة.`
          : `Exam in ${exam.daysLeft} days. The planner gives this subject more revision time.`,
      href: "/dashboard/study-plan",
      priority: 1,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "start-today",
      kind: "lesson",
      title: lang === "ar" ? "ابدأ أول جلسة مذاكرة اليوم" : "Start your first study session today",
      reason:
        lang === "ar"
          ? "أضف موادك وتواريخ اختباراتك ليبني EduMind خطة يومية واقعية."
          : "Add your subjects and exam dates so EduMind can build a realistic daily plan.",
      href: "/dashboard/academic-profile",
      priority: 2,
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

export async function getAssessmentHistory(userId: string): Promise<
  Array<{
    quizId: string;
    title: string;
    score: number;
    completedAt: string;
    durationSeconds: number | null;
    lessonId: string | null;
  }>
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, score, completed_at, duration_seconds, quizzes(title, lesson_id)")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(12);

  return (
    (data ?? []) as unknown as Array<{
      quiz_id: string;
      score: number;
      completed_at: string;
      duration_seconds: number | null;
      quizzes:
        | { title: string; lesson_id: string | null }
        | Array<{ title: string; lesson_id: string | null }>
        | null;
    }>
  ).map((row) => {
    const quiz = Array.isArray(row.quizzes) ? row.quizzes[0] : row.quizzes;
    return {
      quizId: row.quiz_id,
      title: quiz?.title ?? "",
      score: row.score,
      completedAt: row.completed_at,
      durationSeconds: row.duration_seconds,
      lessonId: quiz?.lesson_id ?? null,
    };
  });
}
