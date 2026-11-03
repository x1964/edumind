import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MaterialSummaryRow, QuizAttempt, StudyTask } from "@/lib/types";

export interface ActivityItem {
  id: string;
  kind: "material" | "quiz" | "summary" | "mind_map" | "task";
  title: string;
  createdAt: string;
  href: string;
}

export interface DashboardData {
  materialCount: number;
  attemptCount: number;
  sessionCount: number;
  averageScore: number | null;
  weeklySeconds: number;
  continueMaterials: MaterialSummaryRow[];
  recentMaterials: MaterialSummaryRow[];
  upcomingTasks: StudyTask[];
  recentAttempts: QuizAttempt[];
  activity: ActivityItem[];
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    materialCount,
    attemptCount,
    sessionCount,
    scores,
    weeklySessions,
    continueMaterials,
    recentMaterials,
    upcomingTasks,
    recentAttempts,
    recentMaterialRows,
    recentSummaryRows,
    recentMapRows,
    recentTaskRows,
  ] = await Promise.all([
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("study_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("quiz_attempts").select("score").eq("user_id", userId).limit(100),
    supabase
      .from("study_sessions")
      .select("duration_seconds")
      .eq("user_id", userId)
      .gte("ended_at", weekStart.toISOString()),
    supabase
      .from("materials")
      .select("id, file_name, file_type, file_size, status, created_at, last_opened_at")
      .eq("user_id", userId)
      .not("last_opened_at", "is", null)
      .order("last_opened_at", { ascending: false })
      .limit(4),
    supabase
      .from("materials")
      .select("id, file_name, file_type, file_size, status, created_at, last_opened_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("study_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("materials")
      .select("id, file_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("summaries")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("mind_maps")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("study_tasks")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const scoreRows = (scores.data ?? []) as Array<{ score: number }>;
  const averageScore =
    scoreRows.length > 0
      ? Math.round(scoreRows.reduce((sum, row) => sum + row.score, 0) / scoreRows.length)
      : null;

  const weeklySeconds = ((weeklySessions.data ?? []) as Array<{ duration_seconds: number }>).reduce(
    (sum, row) => sum + row.duration_seconds,
    0
  );

  const activity: ActivityItem[] = [
    ...(recentMaterialRows.data ?? []).map((row) => ({
      id: `material-${row.id}`,
      kind: "material" as const,
      title: row.file_name,
      createdAt: row.created_at,
      href: `/dashboard/materials/${row.id}`,
    })),
    ...(recentSummaryRows.data ?? []).map((row) => ({
      id: `summary-${row.id}`,
      kind: "summary" as const,
      title: row.title,
      createdAt: row.created_at,
      href: `/dashboard/summaries/${row.id}`,
    })),
    ...(recentMapRows.data ?? []).map((row) => ({
      id: `map-${row.id}`,
      kind: "mind_map" as const,
      title: row.title,
      createdAt: row.created_at,
      href: `/dashboard/mind-maps/${row.id}`,
    })),
    ...(recentTaskRows.data ?? []).map((row) => ({
      id: `task-${row.id}`,
      kind: "task" as const,
      title: row.title,
      createdAt: row.created_at,
      href: "/dashboard/study-plan",
    })),
    ...((recentAttempts.data ?? []) as QuizAttempt[]).map((row) => ({
      id: `attempt-${row.id}`,
      kind: "quiz" as const,
      title: `${row.score}%`,
      createdAt: row.completed_at,
      href: `/dashboard/quizzes/${row.quiz_id}`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  const continueLearningMaterials = ((continueMaterials.data ?? []) as MaterialSummaryRow[]).filter(
    (row) => row.status === "ready"
  );

  return {
    materialCount: materialCount.count ?? 0,
    attemptCount: attemptCount.count ?? 0,
    sessionCount: sessionCount.count ?? 0,
    averageScore,
    weeklySeconds,
    continueMaterials:
      continueLearningMaterials.length > 0
        ? continueLearningMaterials
        : ((recentMaterials.data ?? []) as MaterialSummaryRow[]),
    recentMaterials: (recentMaterials.data ?? []) as MaterialSummaryRow[],
    upcomingTasks: (upcomingTasks.data ?? []) as StudyTask[],
    recentAttempts: (recentAttempts.data ?? []) as QuizAttempt[],
    activity,
  };
}
