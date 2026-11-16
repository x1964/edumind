import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileSearch,
  ListChecks,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getAssessmentHistory, getExamInsights, getStudentSubjects } from "@/lib/learning/queries";
import { formatDate, formatNumber } from "@/lib/format";

export const instant = false;

export default async function ExamsPage() {
  const { dict, lang } = await getAppMessages();
  const user = await getCurrentUser();
  if (!user) return null;

  const [insights, history, subjects] = await Promise.all([
    getExamInsights(user.id),
    getAssessmentHistory(user.id),
    getStudentSubjects(user.id),
  ]);

  const maxQuestions = Math.max(1, ...insights.topics.map((topic) => topic.questionCount));

  return (
    <div className="space-y-6">
      <PageHeader
        title={dict.learn.examsTitle}
        description={dict.learn.examsSubtitle}
        action={
          <Link
            href="/dashboard/quizzes?create=1"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
          >
            <ListChecks className="size-4" aria-hidden="true" />
            {dict.learn.takeAssessment}
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] px-4 py-3">
        <FileSearch className="size-4 shrink-0 text-sky-700" aria-hidden="true" />
        <p className="text-[12px] leading-relaxed text-ink-soft">{dict.learn.dataQualityNote}</p>
        <Badge tone="info" className="ms-auto">
          {dict.learn.verifiedData}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-brand-ink" aria-hidden="true" />
            <CardTitle>{dict.learn.analysisTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="max-w-3xl text-[12px] leading-relaxed text-ink-muted">
            {dict.learn.analysisBody}
          </p>

          {insights.archivesAnalyzed === 0 ? (
            <EmptyState
              icon={<FileSearch className="size-5" />}
              title={dict.learn.noExamData}
              description={dict.learn.noExamDataBody}
              className="py-8"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label={dict.learn.archivesAnalyzed}
                  value={formatNumber(insights.archivesAnalyzed, lang)}
                />
                <Stat label={dict.learn.yearsIncluded} value={String(insights.years.length)} />
                <Stat
                  label={dict.learn.questionsAnalyzed}
                  value={formatNumber(insights.questions, lang)}
                />
                <Stat
                  label={dict.learn.roomSubject}
                  value={formatNumber(insights.subjectIds.length, lang)}
                />
              </div>
              {insights.years.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[12px] text-ink-muted">{dict.learn.yearsIncluded}:</span>
                  {insights.years.map((year) => (
                    <Badge key={year} tone="neutral">
                      {year}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div>
                <h3 className="text-[13px] font-semibold text-ink">{dict.learn.topicFrequency}</h3>
                <ul className="mt-2 space-y-2">
                  {insights.topics.map((topic) => (
                    <li
                      key={topic.topic}
                      className="rounded-xl border border-hairline/70 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                          {topic.topic}
                        </span>
                        <span className="text-[11.5px] text-ink-muted">
                          {dict.learn.topicAppeared
                            .replace("{count}", String(topic.archives))
                            .replace("{total}", String(insights.archivesAnalyzed))}
                        </span>
                        <span className="text-[11.5px] text-ink-muted">
                          {topic.share}% {dict.learn.shareOfQuestions}
                        </span>
                        <Link
                          href={`/dashboard/tutor?prompt=${encodeURIComponent(topic.topic)}`}
                          className="text-[11.5px] font-medium text-brand-ink hover:opacity-80"
                        >
                          {dict.learn.reviewTopic}
                        </Link>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{
                            width: `${Math.max(4, Math.round((topic.questionCount / maxQuestions) * 100))}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-muted">{dict.learn.historicalNote}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {insights.questionTypes.length > 0 ? (
                <div>
                  <h3 className="text-[13px] font-semibold text-ink">{dict.learn.questionTypes}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {insights.questionTypes.map((type) => (
                      <Badge key={type.type} tone="neutral">
                        {type.type} · {type.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-brand-ink" aria-hidden="true" />
            <CardTitle>{dict.learn.assessmentHistory}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center">
              <p className="text-[12px] text-ink-muted">{dict.learn.noAssessments}</p>
              <Link
                href="/dashboard/quizzes?create=1"
                className="mt-3 inline-flex h-8 items-center rounded-lg bg-brand px-3 text-[12px] font-semibold text-primary-foreground hover:bg-brand-deep"
              >
                {dict.learn.takeAssessment}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-hairline/60">
              {history.map((attempt) => (
                <li
                  key={`${attempt.quizId}-${attempt.completedAt}`}
                  className="flex flex-wrap items-center gap-2 py-2.5"
                >
                  <Link
                    href={`/dashboard/quizzes/${attempt.quizId}`}
                    className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink hover:text-brand-ink"
                  >
                    {attempt.title || dict.learn.assessmentHistory}
                  </Link>
                  {attempt.durationSeconds !== null ? (
                    <span className="text-[11.5px] text-ink-muted">
                      {dict.learn.durationLabel}:{" "}
                      {Math.max(1, Math.round(attempt.durationSeconds / 60))}{" "}
                      {dict.learn.minutesShort}
                    </span>
                  ) : null}
                  <span className="text-[11.5px] text-ink-muted" dir="ltr">
                    {formatDate(attempt.completedAt, lang)}
                  </span>
                  <Badge
                    tone={
                      attempt.score >= 80 ? "brand" : attempt.score >= 50 ? "warning" : "danger"
                    }
                  >
                    {formatNumber(attempt.score, lang)}%
                  </Badge>
                  <Link
                    href={`/dashboard/quizzes/${attempt.quizId}`}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-ink hover:opacity-80"
                  >
                    {dict.common.viewAll}
                    <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
                    <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {subjects.length === 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
          <AlertTriangle className="size-4 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="text-[12px] text-ink-soft">{dict.learn.needsSubjects}</p>
          <Link
            href="/dashboard/academic-profile"
            className="ms-auto text-[12px] font-medium text-brand-ink hover:opacity-80"
          >
            {dict.nav.academicProfile}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-black/[0.015] p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="em-num mt-1 text-[19px] font-semibold text-ink" dir="auto">
        {value}
      </p>
    </div>
  );
}
