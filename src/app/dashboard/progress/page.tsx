import { Activity, Clock3, FileText, ListChecks, Sparkles, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MaterialsTypeChart,
  QuizScoreChart,
  WeeklyStudyChart,
} from "@/components/progress/progress-charts";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";

export const instant = false;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export default async function ProgressPage() {
  const { dict, lang } = await getAppMessages();
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);

  const [sessionCount, attemptCount, materialCount] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "ready"),
  ]);

  const [{ data: sessionRows }, { data: attemptRows }, { data: materialRows }] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("duration_seconds, ended_at")
      .eq("user_id", user.id)
      .gte("ended_at", since.toISOString())
      .order("ended_at", { ascending: true })
      .limit(1000),
    supabase
      .from("quiz_attempts")
      .select("score, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true })
      .limit(100),
    supabase.from("materials").select("file_type, status").eq("user_id", user.id).limit(1000),
  ]);

  const sessions = (sessionRows ?? []) as Array<{ duration_seconds: number; ended_at: string }>;
  const attempts = (attemptRows ?? []) as Array<{ score: number; completed_at: string }>;
  const materials = (materialRows ?? []) as Array<{ file_type: string; status: string }>;

  const weeklySeconds = sessions.reduce((sum, row) => sum + row.duration_seconds, 0);
  const averageScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, row) => sum + row.score, 0) / attempts.length)
      : null;

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    return date;
  });

  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.ended_at));
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.duration_seconds / 60);
  }

  const weeklyData = days.map((date) => ({
    label: new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
      weekday: "short",
    }).format(date),
    minutes: Math.round(minutesByDay.get(dayKey(date)) ?? 0),
  }));

  const scoreData = attempts.slice(-8).map((attempt) => ({
    label: new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
      day: "numeric",
      month: "short",
    }).format(new Date(attempt.completed_at)),
    score: attempt.score,
  }));

  const typeCounts = new Map<string, number>();
  for (const material of materials) {
    typeCounts.set(material.file_type, (typeCounts.get(material.file_type) ?? 0) + 1);
  }
  const typeData = ["pdf", "docx", "txt"].map((type) => ({
    label: dict.progress[type as "pdf" | "docx" | "txt"],
    count: typeCounts.get(type) ?? 0,
  }));

  const stats = [
    {
      label: dict.progress.studySessions,
      value: formatNumber(sessionCount.count ?? 0, lang),
      icon: Clock3,
    },
    {
      label: dict.progress.completedQuizzes,
      value: formatNumber(attemptCount.count ?? 0, lang),
      icon: ListChecks,
    },
    {
      label: dict.progress.avgScore,
      value: averageScore === null ? "—" : `${formatNumber(averageScore, lang)}%`,
      note: dict.progress.avgScoreNote,
      icon: Target,
    },
    {
      label: dict.progress.materialsProcessed,
      value: formatNumber(materialCount.count ?? 0, lang),
      icon: FileText,
    },
  ];

  const hasData = sessions.length > 0 || attempts.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader title={dict.progress.title} description={dict.progress.subtitle} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <Card key={label} className="h-full border-hairline/60 bg-surface-raised/80">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-ink-muted">{label}</p>
                  <p
                    className="em-num mt-2 text-[26px] font-semibold leading-none tracking-[-0.045em] text-ink"
                    dir="auto"
                  >
                    {value}
                  </p>
                  {note ? (
                    <p className="mt-2.5 truncate border-t border-hairline/60 pt-2 text-[12px] text-ink-muted">
                      {note}
                    </p>
                  ) : null}
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/15 bg-brand/[0.06] text-brand-ink">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface-raised/70 px-4 py-3">
          <TrendingUp className="size-4 text-brand-ink" aria-hidden="true" />
          <span className="text-[12px] text-ink-muted">{dict.progress.weeklyStudyTime}</span>
          <span className="ms-auto text-[14px] font-semibold text-ink">
            {formatDuration(weeklySeconds, lang)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface-raised/70 px-4 py-3">
          <Activity className="size-4 text-brand-ink" aria-hidden="true" />
          <span className="text-[12px] text-ink-muted">{dict.progress.last7Days}</span>
          <span className="ms-auto text-[14px] font-semibold text-ink">
            {formatNumber(sessions.length, lang)}
          </span>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title={dict.progress.noData}
          description={dict.progress.noDataBody}
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="border-hairline/60 bg-surface-raised/80">
              <CardHeader>
                <div>
                  <CardTitle>{dict.progress.weeklyStudyTime}</CardTitle>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{dict.progress.last7Days}</p>
                </div>
                <span className="text-[12px] text-ink-muted">
                  {formatNumber(Math.round(weeklySeconds / 60), lang)} {dict.progress.minutesShort}
                </span>
              </CardHeader>
              <CardContent className="pt-4">
                {weeklySeconds > 0 ? (
                  <WeeklyStudyChart data={weeklyData} dict={dict} rtl={lang === "ar"} />
                ) : (
                  <p className="rounded-xl border border-dashed border-hairline px-4 py-10 text-center text-[12px] text-ink-muted">
                    {dict.progress.emptyChart}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-hairline/60 bg-surface-raised/80">
              <CardHeader>
                <div>
                  <CardTitle>{dict.progress.quizPerformance}</CardTitle>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{dict.progress.quizTrend}</p>
                </div>
                {averageScore !== null ? (
                  <span className="text-[12px] text-ink-muted" dir="auto">
                    {averageScore}%
                  </span>
                ) : null}
              </CardHeader>
              <CardContent className="pt-4">
                {scoreData.length > 0 ? (
                  <QuizScoreChart data={scoreData} dict={dict} rtl={lang === "ar"} />
                ) : (
                  <p className="rounded-xl border border-dashed border-hairline px-4 py-10 text-center text-[12px] text-ink-muted">
                    {dict.progress.noAttempts}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="border-hairline/60 bg-surface-raised/80">
              <CardHeader>
                <CardTitle>{dict.progress.materialsByType}</CardTitle>
                <span className="text-[12px] text-ink-muted">
                  {formatNumber(materials.length, lang)} {dict.common.files}
                </span>
              </CardHeader>
              <CardContent className="pt-4">
                <MaterialsTypeChart data={typeData} rtl={lang === "ar"} />
              </CardContent>
            </Card>

            <Card className="border-hairline/60 bg-surface-raised/80">
              <CardHeader>
                <CardTitle>{dict.quizzes.history}</CardTitle>
                <span className="text-[12px] text-ink-muted">
                  {formatNumber(attempts.length, lang)} {dict.quizzes.attempts}
                </span>
              </CardHeader>
              <CardContent className="pt-4">
                {attempts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-hairline px-4 py-10 text-center text-[12px] text-ink-muted">
                    {dict.quizzes.noAttempts}
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                    {[...attempts]
                      .reverse()
                      .slice(0, 12)
                      .map((attempt) => (
                        <li
                          key={`${attempt.completed_at}-${attempt.score}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-hairline/60 bg-black/[0.015] px-3 py-2"
                        >
                          <span className="text-[12px] text-ink-muted">
                            {formatDate(attempt.completed_at, lang)}
                          </span>
                          <span
                            className={`text-[12px] font-semibold ${
                              attempt.score >= 70
                                ? "text-brand-ink"
                                : attempt.score >= 40
                                  ? "text-amber-700"
                                  : "text-danger"
                            }`}
                            dir="auto"
                          >
                            {attempt.score}%
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <p className="flex items-center justify-center gap-1.5 pb-2 text-[12px] text-ink-muted">
        <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
        {dict.progress.dataNote}
      </p>
    </div>
  );
}
