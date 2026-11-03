import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  Network,
  NotebookPen,
  Plus,
  Sparkles,
  Timer,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FileKindIcon } from "@/components/shared/file-icon";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppMessages } from "@/lib/i18n/app";

export const instant = false;

export default async function DashboardOverviewPage() {
  const { dict, lang } = await getAppMessages();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/dashboard");

  const data = await getDashboardData(profile.id);

  const stats = [
    {
      label: dict.dashboard.materialsCount,
      value: formatNumber(data.materialCount, lang),
      note: dict.dashboard.materialsNote,
      icon: FileText,
    },
    {
      label: dict.dashboard.quizzesCompleted,
      value: formatNumber(data.attemptCount, lang),
      note: dict.dashboard.quizzesNote,
      icon: ListChecks,
    },
    {
      label: dict.dashboard.studySessions,
      value: formatNumber(data.sessionCount, lang),
      note: dict.dashboard.sessionsNote,
      icon: Clock3,
    },
    {
      label: dict.progress.weeklyStudyTime,
      value: formatDuration(data.weeklySeconds, lang),
      note: dict.progress.last7Days,
      icon: Timer,
    },
    {
      label: dict.dashboard.avgScore,
      value: data.averageScore === null ? "—" : `${formatNumber(data.averageScore, lang)}%`,
      note: data.averageScore === null ? dict.dashboard.noScoreYet : dict.dashboard.progressNote,
      icon: Sparkles,
    },
  ];

  const quickActions = [
    { href: "/dashboard/materials?upload=1", label: dict.dashboard.upload, icon: Upload },
    { href: "/dashboard/tutor", label: dict.dashboard.askTutor, icon: BrainCircuit },
    { href: "/dashboard/summaries?create=1", label: dict.dashboard.newSummary, icon: NotebookPen },
    { href: "/dashboard/quizzes?create=1", label: dict.dashboard.newQuiz, icon: ListChecks },
    { href: "/dashboard/mind-maps?create=1", label: dict.dashboard.newMindMap, icon: Network },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={dict.dashboard.welcome.replace(
          "{name}",
          profile.fullName.split(" ")[0] || profile.fullName
        )}
        description={dict.dashboard.subtitle}
        action={
          <Link
            href="/dashboard/materials?upload=1"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
          >
            <Plus className="size-4" aria-hidden="true" />
            {dict.dashboard.upload}
          </Link>
        }
      />

      <section aria-label={dict.dashboard.quickStats}>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {stats.map(({ label, value, note, icon: Icon }, index) => (
            <Card
              key={label}
              className={cn(
                "relative overflow-hidden",
                index === stats.length - 1 && "col-span-2 xl:col-span-1"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-ink-muted">{label}</p>
                    <p
                      className="em-num mt-2 text-[26px] font-semibold leading-none tracking-[-0.045em] text-ink"
                      dir="ltr"
                    >
                      {value}
                    </p>
                  </div>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/15 bg-brand/[0.06] text-brand-ink">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2.5 truncate border-t border-hairline/60 pt-2 text-[10.5px] text-ink-muted">
                  {note}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{dict.dashboard.continueLearning}</CardTitle>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">
                  {dict.dashboard.continueLearningBody}
                </p>
              </div>
              <Link
                href="/dashboard/materials"
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-ink hover:opacity-80"
              >
                {dict.common.viewAll}
                <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
                <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {data.continueMaterials.length === 0 ? (
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title={dict.dashboard.noMaterials}
                  description={dict.dashboard.noMaterialsBody}
                  action={
                    <Link
                      href="/dashboard/materials?upload=1"
                      className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[12.5px] font-semibold text-primary-foreground hover:bg-brand-deep"
                    >
                      <Upload className="size-3.5" aria-hidden="true" />
                      {dict.dashboard.uploadFirst}
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {data.continueMaterials.map((material) => (
                    <li key={material.id}>
                      <Link
                        href={`/dashboard/materials/${material.id}`}
                        className="flex items-center gap-3 rounded-xl border border-hairline/70 bg-black/[0.015] px-3 py-2.5 transition-colors hover:border-hairline-strong hover:bg-black/[0.035]"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-black/[0.03] text-ink-soft">
                          <FileKindIcon kind={material.file_type} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[13px] font-medium text-ink"
                            dir="ltr"
                          >
                            {material.file_name}
                          </span>
                          <span className="block text-[10.5px] text-ink-muted">
                            {dict.materials.uploadedAt} · {formatDate(material.created_at, lang)}
                          </span>
                        </span>
                        <ArrowRight
                          className="size-3.5 shrink-0 text-ink-muted rtl:hidden"
                          aria-hidden="true"
                        />
                        <ArrowLeft
                          className="size-3.5 shrink-0 text-ink-muted ltr:hidden"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.recentMaterials}</CardTitle>
              <Link
                href="/dashboard/materials"
                className="text-[11.5px] font-medium text-brand-ink hover:opacity-80"
              >
                {dict.common.viewAll}
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {data.recentMaterials.length === 0 ? (
                <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] text-ink-muted">
                  {dict.dashboard.noMaterialsBody}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.recentMaterials.map((material) => (
                    <Link
                      key={material.id}
                      href={`/dashboard/materials/${material.id}`}
                      className="group rounded-xl border border-hairline/70 bg-black/[0.015] p-3 transition-colors hover:border-hairline-strong hover:bg-black/[0.035]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid size-8 place-items-center rounded-lg border border-hairline bg-black/[0.03] text-ink-soft">
                          <FileKindIcon kind={material.file_type} className="size-3.5" />
                        </span>
                        <MaterialStatus status={material.status} dict={dict} />
                      </div>
                      <p className="mt-2 truncate text-[12.5px] font-medium text-ink" dir="ltr">
                        {material.file_name}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-ink-muted">
                        {formatDate(material.created_at, lang)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-2">
                {quickActions.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-hairline/70 bg-black/[0.015] px-3 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-brand/30 hover:bg-brand/[0.05] hover:text-ink"
                  >
                    <Icon className="size-4 text-brand-ink" aria-hidden="true" />
                    {label}
                    <ArrowRight
                      className="ms-auto size-3.5 text-ink-muted rtl:hidden"
                      aria-hidden="true"
                    />
                    <ArrowLeft
                      className="ms-auto size-3.5 text-ink-muted ltr:hidden"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.dashboard.plannerPreview}</CardTitle>
              </div>
              <Link
                href="/dashboard/study-plan"
                className="text-[11.5px] font-medium text-brand-ink hover:opacity-80"
              >
                {dict.common.viewAll}
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {data.upcomingTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center">
                  <p className="text-[12.5px] font-medium text-ink">{dict.dashboard.noTasks}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">{dict.dashboard.noTasksBody}</p>
                  <Link
                    href="/dashboard/study-plan?create=1"
                    className="mt-3 inline-flex h-8 items-center rounded-lg border border-hairline px-3 text-[11.5px] font-medium text-ink-soft hover:bg-black/[0.04]"
                  >
                    {dict.dashboard.addTask}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.upcomingTasks.map((task) => (
                    <li key={task.id} className="flex items-start gap-2.5 rounded-lg px-1 py-1.5">
                      <span
                        className={`mt-1 size-1.5 shrink-0 rounded-full ${
                          task.priority === "high"
                            ? "bg-[#ef4444]"
                            : task.priority === "low"
                              ? "bg-ink-muted"
                              : "bg-brand"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-ink-soft">
                          {task.title}
                        </span>
                        <span className="block text-[10px] text-ink-muted">
                          {task.due_date ? formatDate(task.due_date, lang) : dict.planner.noDueDate}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.dashboard.recentActivity}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {data.activity.length === 0 ? (
                <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] text-ink-muted">
                  {dict.dashboard.noActivityBody}
                </p>
              ) : (
                <ol className="relative space-y-3 before:absolute before:inset-y-1 before:start-[11px] before:w-px before:bg-hairline">
                  {data.activity.map((item) => (
                    <li key={item.id} className="relative flex items-start gap-3 ps-0">
                      <span className="relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-hairline bg-surface-raised text-ink-muted">
                        {item.kind === "material" ? (
                          <FileText className="size-3" aria-hidden="true" />
                        ) : item.kind === "quiz" ? (
                          <ListChecks className="size-3" aria-hidden="true" />
                        ) : item.kind === "summary" ? (
                          <NotebookPen className="size-3" aria-hidden="true" />
                        ) : item.kind === "mind_map" ? (
                          <Network className="size-3" aria-hidden="true" />
                        ) : (
                          <CalendarClock className="size-3" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={item.href}
                          className="block truncate text-[12px] text-ink-soft transition-colors hover:text-ink"
                        >
                          {item.kind === "quiz"
                            ? `${dict.dashboard.activityQuiz} · ${item.title}`
                            : item.title}
                        </Link>
                        <span className="block text-[10px] text-ink-muted">
                          {formatDate(item.createdAt, lang)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-2 text-[10.5px] text-ink-muted">
        <CheckCircle2 className="size-3 text-brand-ink" aria-hidden="true" />
        {dict.progress.dataNote}
      </div>
    </div>
  );
}

function MaterialStatus({ status, dict }: { status: string; dict: AppMessages }) {
  if (status === "ready") return <Badge tone="brand">{dict.materials.ready}</Badge>;
  if (status === "failed") return <Badge tone="danger">{dict.materials.failed}</Badge>;
  return <Badge tone="warning">{dict.materials.processing}</Badge>;
}
