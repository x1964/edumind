import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Headphones, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LessonActions } from "@/components/learning/lesson-actions";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";

export const instant = false;

interface LessonRow {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  content: string | null;
  difficulty: "easy" | "medium" | "hard";
  estimated_minutes: number;
  curriculum_units:
    | {
        title_ar: string;
        title_en: string;
        subjects:
          { name_ar: string; name_en: string } | Array<{ name_ar: string; name_en: string }> | null;
      }
    | Array<{
        title_ar: string;
        title_en: string;
        subjects:
          { name_ar: string; name_en: string } | Array<{ name_ar: string; name_en: string }> | null;
      }>
    | null;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { dict, lang } = await getAppMessages();
  const { lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("lessons")
    .select(
      "id, title_ar, title_en, description_ar, description_en, content, difficulty, estimated_minutes, published, curriculum_units(title_ar, title_en, subjects(name_ar, name_en))"
    )
    .eq("id", lessonId)
    .eq("published", true)
    .maybeSingle();

  if (!data) notFound();
  const lesson = data as unknown as LessonRow;

  const [{ data: objectives }, { data: progress }] = await Promise.all([
    supabase
      .from("lesson_objectives")
      .select("text_ar, text_en, position")
      .eq("lesson_id", lessonId)
      .order("position"),
    supabase
      .from("lesson_progress")
      .select("mastery, status, attempts, last_score")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
  ]);

  const unit = one(lesson.curriculum_units);
  const subject = one(unit?.subjects);
  const title = lang === "ar" ? lesson.title_ar : lesson.title_en;
  const description = lang === "ar" ? lesson.description_ar : lesson.description_en;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12px] text-ink-muted">
        <Link href="/dashboard/study-plan" className="hover:text-ink">
          {dict.nav.studyPlan}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate">{lang === "ar" ? unit?.title_ar : unit?.title_en}</span>
      </div>

      <PageHeader
        title={title}
        description={description ?? undefined}
        action={
          <Link
            href={`/dashboard/tutor?prompt=${encodeURIComponent(title)}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {dict.learn.askTeacher}
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {subject ? (
          <Badge tone="brand">{lang === "ar" ? subject.name_ar : subject.name_en}</Badge>
        ) : null}
        {unit ? (
          <Badge tone="neutral">{lang === "ar" ? unit.title_ar : unit.title_en}</Badge>
        ) : null}
        <Badge tone="info">{dict.common[lesson.difficulty]}</Badge>
        <Badge tone="neutral">
          {formatNumber(lesson.estimated_minutes, lang)} {dict.common.minutes}
        </Badge>
        {progress ? (
          <Badge tone={progress.mastery >= 80 ? "brand" : "warning"}>
            {dict.dashboard.masteryLabel}: {formatNumber(progress.mastery, lang)}%
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.learn.todayTitle}</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {lesson.content ? (
              <div
                className="max-w-none whitespace-pre-wrap break-words text-[13.5px] leading-7 text-ink-soft"
                dir="auto"
              >
                {lesson.content}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center text-[13px] text-ink-muted">
                {dict.learn.lessonNoContent}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{dict.learn.planSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              {(objectives ?? []).length === 0 ? (
                <p className="text-[12px] text-ink-muted">{dict.learn.noPlanBody}</p>
              ) : (
                <ul className="space-y-2">
                  {((objectives ?? []) as Array<{ text_ar: string; text_en: string }>).map(
                    (objective, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-[12.5px] leading-relaxed text-ink-soft"
                      >
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                          aria-hidden="true"
                        />
                        <span dir="auto">
                          {lang === "ar" ? objective.text_ar : objective.text_en}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.learn.takeQuiz}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <LessonActions lessonId={lesson.id} dict={dict} />
              <Link
                href={`/dashboard/listen?lesson=${lesson.id}`}
                className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04]"
              >
                <Headphones className="size-4 text-brand-ink" aria-hidden="true" />
                {dict.learn.listenTitle}
                <ArrowRight
                  className="ms-auto size-3.5 text-ink-muted rtl:hidden"
                  aria-hidden="true"
                />
                <ArrowLeft
                  className="ms-auto size-3.5 text-ink-muted ltr:hidden"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/dashboard/study-plan"
                className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04]"
              >
                <BookOpen className="size-4 text-brand-ink" aria-hidden="true" />
                {dict.learn.planTitle}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
