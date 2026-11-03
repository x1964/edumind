import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  History,
  ListChecks,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { QuizResults } from "@/components/quizzes/quiz-results";
import { StudyTracker } from "@/components/dashboard/study-tracker";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteQuizAction } from "@/lib/actions/library";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/lib/types";

export const instant = false;

export default async function QuizDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const { quizId } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: quizRow }, { data: questionRows }, { data: attemptRows }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("*, materials(file_name)")
      .eq("id", quizId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("quiz_questions")
      .select("id, quiz_id, user_id, position, type, prompt, options")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  if (!quizRow) notFound();

  const quiz = quizRow as Quiz;
  const questions = (questionRows ?? []) as QuizQuestion[];
  const attempts = (attemptRows ?? []) as QuizAttempt[];
  const activeAttempt = query.attempt
    ? (attempts.find((attempt) => attempt.id === query.attempt) ?? null)
    : null;
  const bestScore =
    attempts.length > 0 ? Math.max(...attempts.map((attempt) => attempt.score)) : null;

  return (
    <div className="space-y-5">
      <StudyTracker materialId={quiz.material_id} activity="quiz" />

      <Link
        href="/dashboard/quizzes"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
        <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
        {dict.quizzes.backToQuizzes}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
              <ListChecks className="size-4" aria-hidden="true" />
            </span>
            <Badge tone="neutral">{dict.common[quiz.difficulty]}</Badge>
            <Badge tone="info">
              {dict.quizzes.questionsCount.replace("{count}", String(questions.length))}
            </Badge>
          </div>
          <h1 className="mt-2.5 break-words text-[24px] font-semibold leading-snug tracking-[-0.03em] text-ink">
            {quiz.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
            {quiz.materials?.file_name ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <FileText className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate" dir="auto">
                  {quiz.materials.file_name}
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3" aria-hidden="true" />
              {formatDate(quiz.created_at, lang)}
            </span>
          </div>
        </div>

        <ConfirmAction
          action={deleteQuizAction.bind(null, quiz.id)}
          title={dict.quizzes.deleteTitle}
          description={dict.quizzes.deleteBody}
          confirmLabel={dict.common.delete}
          cancelLabel={dict.common.cancel}
          triggerLabel={dict.common.delete}
          successMessage={dict.quizzes.deleteSuccess}
          className="h-9 border border-hairline px-3"
        />
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {activeAttempt ? (
            <QuizResults
              attempt={activeAttempt}
              questions={questions}
              quizId={quiz.id}
              dict={dict}
            />
          ) : (
            <QuizRunner quizId={quiz.id} questions={questions} dict={dict} />
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.quizzes.results}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-muted">{dict.quizzes.attempts}</span>
                <span className="text-[13px] font-semibold text-ink" dir="auto">
                  {attempts.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-ink-muted">{dict.quizzes.bestScore}</span>
                <span className="text-[13px] font-semibold text-brand-ink" dir="auto">
                  {bestScore === null ? "—" : `${bestScore}%`}
                </span>
              </div>
              <p className="border-t border-hairline/60 pt-2.5 text-[12px] leading-relaxed text-ink-muted">
                {dict.quizzes.reviewNote}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="size-4 text-ink-muted" aria-hidden="true" />
                <CardTitle>{dict.quizzes.history}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {attempts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-hairline px-3 py-4 text-center text-[12px] text-ink-muted">
                  {dict.quizzes.noHistory}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {attempts.map((attempt) => (
                    <li key={attempt.id}>
                      <Link
                        href={`/dashboard/quizzes/${quiz.id}?attempt=${attempt.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-hairline/60 bg-black/[0.015] px-2.5 py-2 transition-colors hover:border-brand/30 hover:bg-brand/[0.04]"
                      >
                        <span className="min-w-0">
                          <span className="block text-[12px] text-ink-muted">
                            {formatDateTime(attempt.completed_at, lang)}
                          </span>
                          <span className="block text-[12px] text-ink-muted">
                            {attempt.correct_count}/{attempt.total_count}
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] font-semibold text-ink" dir="auto">
                          {attempt.score}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
