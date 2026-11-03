import Link from "next/link";
import { ArrowLeft, ArrowRight, ListChecks, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { CreateQuizDialog } from "@/components/quizzes/create-quiz-dialog";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/provider";
import { deleteQuizAction } from "@/lib/actions/library";
import { formatDate } from "@/lib/format";
import type { Quiz } from "@/lib/types";

export const instant = false;

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string; material?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: quizRows }, { data: materialRows }, { data: attemptRows }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("*, materials(file_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("materials")
      .select("id, file_name")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("quiz_attempts")
      .select("quiz_id, score, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(300),
  ]);

  const quizzes = (quizRows ?? []) as Quiz[];
  const materials = (materialRows ?? []) as Array<{ id: string; file_name: string }>;
  const attempts = (attemptRows ?? []) as Array<{
    quiz_id: string;
    score: number;
    completed_at: string;
  }>;

  const statsByQuiz = new Map<string, { count: number; best: number; last: string }>();
  for (const attempt of attempts) {
    const current = statsByQuiz.get(attempt.quiz_id);
    if (!current) {
      statsByQuiz.set(attempt.quiz_id, {
        count: 1,
        best: attempt.score,
        last: attempt.completed_at,
      });
    } else {
      current.count += 1;
      current.best = Math.max(current.best, attempt.score);
    }
  }

  const defaultMaterialId =
    params.material && materials.some((material) => material.id === params.material)
      ? params.material
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={dict.quizzes.title}
        description={dict.quizzes.subtitle}
        action={
          <CreateQuizDialog
            dict={dict}
            materials={materials}
            aiConfigured={isAiConfigured()}
            defaultMaterialId={defaultMaterialId}
            defaultOpen={params.create === "1"}
          />
        }
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title={dict.quizzes.empty}
          description={dict.quizzes.emptyBody}
          action={
            materials.length > 0 ? (
              <CreateQuizDialog dict={dict} materials={materials} aiConfigured={isAiConfigured()} />
            ) : (
              <Link
                href="/dashboard/materials?upload=1"
                className="inline-flex h-9 items-center rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
              >
                {dict.nav.materials}
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => {
            const stats = statsByQuiz.get(quiz.id);
            return (
              <Card
                key={quiz.id}
                className="group flex flex-col border-hairline/60 bg-surface-raised/80"
              >
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
                      <ListChecks className="size-4" aria-hidden="true" />
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge tone="neutral">{dict.common[quiz.difficulty]}</Badge>
                      <ConfirmAction
                        action={deleteQuizAction.bind(null, quiz.id)}
                        title={dict.quizzes.deleteTitle}
                        description={dict.quizzes.deleteBody}
                        confirmLabel={dict.common.delete}
                        cancelLabel={dict.common.cancel}
                        successMessage={dict.quizzes.deleteSuccess}
                        iconOnly
                      />
                    </div>
                  </div>

                  <Link href={`/dashboard/quizzes/${quiz.id}`} className="mt-3 flex-1">
                    <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-ink">
                      {quiz.title}
                    </h2>
                    <p className="mt-1 truncate text-[12px] text-ink-muted" dir="auto">
                      {quiz.materials?.file_name ?? "—"}
                    </p>
                  </Link>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-hairline/60 bg-black/[0.015] p-2.5">
                    <div>
                      <p className="text-[12px] uppercase tracking-wide text-ink-muted">
                        {dict.quizzes.attempts}
                      </p>
                      <p className="text-[13px] font-semibold text-ink" dir="auto">
                        {stats?.count ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] uppercase tracking-wide text-ink-muted">
                        {dict.quizzes.bestScore}
                      </p>
                      <p
                        className="flex items-center gap-1 text-[13px] font-semibold text-brand-ink"
                        dir="auto"
                      >
                        <Target className="size-3" aria-hidden="true" />
                        {stats ? `${stats.best}%` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-hairline/60 pt-2.5">
                    <span className="text-[12px] text-ink-muted">
                      {stats ? formatDate(stats.last, lang) : formatDate(quiz.created_at, lang)}
                    </span>
                    <Link
                      href={`/dashboard/quizzes/${quiz.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-ink hover:opacity-80"
                    >
                      {stats ? dict.common.open : dict.quizzes.start}
                      <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
                      <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {quizzes.length === 0 ? null : (
        <p className="flex items-center justify-center gap-1.5 pb-2 text-[12px] text-ink-muted">
          <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
          {dict.quizzes.reviewNote}
        </p>
      )}
    </div>
  );
}
