"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Repeat,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  completePlanItemAction,
  generateStudyPlanAction,
  reschedulePlanItemAction,
  skipPlanItemAction,
} from "@/lib/actions/learning";
import { toDateKey } from "@/lib/learning/planner";
import type { ActivePlan, PlanItemRow } from "@/lib/learning/queries";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Busy = { id: string; action: "complete" | "skip" | "reschedule" } | null;

export function PlanBoard({
  dict,
  lang,
  plan,
  items,
}: {
  dict: AppMessages;
  lang: Lang;
  plan: ActivePlan | null;
  items: PlanItemRow[];
}) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<Busy>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const todayItems = items.filter((item) => item.planned_date === todayKey);
  const futureItems = items.filter((item) => item.planned_date > todayKey);
  const pastItems = items.filter((item) => item.planned_date < todayKey);
  const doneToday = todayItems.filter((item) => item.status === "completed").length;
  const minutesToday = todayItems.reduce((sum, item) => sum + item.duration_minutes, 0);

  const upcomingByDate = useMemo(() => {
    const map = new Map<string, PlanItemRow[]>();
    for (const item of futureItems) {
      const list = map.get(item.planned_date) ?? [];
      list.push(item);
      map.set(item.planned_date, list);
    }
    return [...map.entries()].slice(0, 10);
  }, [futureItems]);

  function generate() {
    startGenerating(async () => {
      const result = await generateStudyPlanAction();
      if (result.ok) {
        toast.success(result.message ?? dict.learn.planGenerated);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function complete(id: string) {
    setBusy({ id, action: "complete" });
    startTransition(async () => {
      const result = await completePlanItemAction(id);
      setBusy(null);
      if (result.ok) {
        toast.success(result.message ?? dict.learn.itemCompleted);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function skip(id: string) {
    setBusy({ id, action: "skip" });
    startTransition(async () => {
      const result = await skipPlanItemAction(id);
      setBusy(null);
      if (result.ok) {
        toast.success(result.message ?? dict.learn.skipped);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function openReschedule(item: PlanItemRow) {
    setRescheduleId(item.id);
    setRescheduleDate(item.planned_date);
  }

  function confirmReschedule(id: string) {
    if (!rescheduleDate) return;
    setBusy({ id, action: "reschedule" });
    startTransition(async () => {
      const result = await reschedulePlanItemAction(id, rescheduleDate);
      setBusy(null);
      if (result.ok) {
        toast.success(result.message ?? dict.learn.rescheduled);
        setRescheduleId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-raised/80 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{dict.learn.planTitle}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">{dict.learn.planBody}</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isGenerating}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50"
        >
          {isGenerating ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : plan ? (
            <RefreshCw className="size-4" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {isGenerating
            ? dict.learn.generatingPlan
            : plan
              ? dict.learn.regeneratePlan
              : dict.learn.generatePlan}
        </button>
      </div>

      {!plan || items.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-5" />}
          title={dict.learn.noPlanTitle}
          description={dict.learn.noPlanBody}
          action={
            <Link
              href="/dashboard/academic-profile"
              className="inline-flex h-9 items-center rounded-xl border border-hairline px-3.5 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
            >
              {dict.learn.profileTitle}
            </Link>
          }
        />
      ) : (
        <>
          {items.every((item) => !item.lesson_id) ? (
            <p className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-soft">
              {dict.learn.subjectOnlyNotice}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={dict.learn.totalMinutes} value={formatNumber(minutesToday, lang)} />
            <Stat label={dict.learn.completedLabel} value={`${doneToday}/${todayItems.length}`} />
            <Stat
              label={dict.learn.lessonsScheduled}
              value={formatNumber(items.filter((item) => item.kind === "learn").length, lang)}
            />
            <Stat
              label={dict.learn.remainingTasks}
              value={formatNumber(
                items.filter((item) => item.status === "pending" || item.status === "rescheduled")
                  .length,
                lang
              )}
            />
          </div>

          <section id="today" className="rounded-2xl border border-hairline bg-surface-raised/80">
            <header className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
              <h3 className="text-[14px] font-semibold text-ink">{dict.learn.todayTitle}</h3>
              <span className="text-[12px] text-ink-muted">
                {dict.learn.tasksDone
                  .replace("{done}", String(doneToday))
                  .replace("{total}", String(todayItems.length))}
              </span>
            </header>
            {todayItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-ink-muted">
                {dict.learn.todayEmpty}
              </p>
            ) : (
              <ul className="divide-y divide-hairline/60">
                {todayItems.map((item) => (
                  <PlanItem
                    key={item.id}
                    item={item}
                    dict={dict}
                    lang={lang}
                    busy={busy}
                    rescheduleId={rescheduleId}
                    rescheduleDate={rescheduleDate}
                    onRescheduleDate={setRescheduleDate}
                    onComplete={complete}
                    onSkip={skip}
                    onOpenReschedule={openReschedule}
                    onConfirmReschedule={confirmReschedule}
                  />
                ))}
              </ul>
            )}
          </section>

          {upcomingByDate.length > 0 ? (
            <section className="rounded-2xl border border-hairline bg-surface-raised/80">
              <header className="border-b border-hairline px-4 py-3">
                <h3 className="text-[14px] font-semibold text-ink">{dict.learn.weekView}</h3>
              </header>
              <div className="divide-y divide-hairline/60">
                {upcomingByDate.map(([date, dateItems]) => (
                  <div key={date} className="px-4 py-3">
                    <p className="text-[12px] font-semibold text-ink-muted" dir="ltr">
                      {date}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {dateItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-2">
                          <KindDot kind={item.kind} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-ink">
                              {item.title}
                            </p>
                            <p className="text-[12px] text-ink-muted">
                              {formatNumber(item.duration_minutes, lang)} {dict.common.minutes}
                              {item.lesson_id ? ` · ${dict.learn.openLesson}` : ""}
                            </p>
                          </div>
                          {item.lesson_id ? (
                            <Link
                              href={`/dashboard/lessons/${item.lesson_id}`}
                              className="shrink-0 text-[12px] font-medium text-brand-ink hover:opacity-80"
                            >
                              {dict.learn.openLesson}
                            </Link>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {pastItems.length > 0 ? (
            <section className="rounded-2xl border border-hairline bg-surface-raised/80">
              <button
                type="button"
                onClick={() => setShowCompleted((value) => !value)}
                aria-expanded={showCompleted}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start"
              >
                <span className="text-[14px] font-semibold text-ink">{dict.learn.planSummary}</span>
                <span className="text-[12px] text-ink-muted">{pastItems.length}</span>
              </button>
              {showCompleted ? (
                <ul className="divide-y divide-hairline/60 border-t border-hairline">
                  {pastItems.slice(0, 30).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                      <KindDot kind={item.kind} />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[12px] text-ink-muted" dir="ltr">
                        {item.planned_date}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function PlanItem({
  item,
  dict,
  lang,
  busy,
  rescheduleId,
  rescheduleDate,
  onRescheduleDate,
  onComplete,
  onSkip,
  onOpenReschedule,
  onConfirmReschedule,
}: {
  item: PlanItemRow;
  dict: AppMessages;
  lang: Lang;
  busy: Busy;
  rescheduleId: string | null;
  rescheduleDate: string;
  onRescheduleDate: (value: string) => void;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenReschedule: (item: PlanItemRow) => void;
  onConfirmReschedule: (id: string) => void;
}) {
  const done = item.status === "completed";
  const skipped = item.status === "skipped";
  const isBusy = busy?.id === item.id;
  return (
    <li className={cn("px-4 py-3", done && "bg-brand/[0.03]")}>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onComplete(item.id)}
          disabled={isBusy || done}
          aria-label={dict.learn.markDone}
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
            done
              ? "border-brand bg-brand text-primary-foreground"
              : "border-hairline-strong text-transparent hover:border-brand/60"
          )}
        >
          {busy?.id === item.id && busy.action === "complete" ? (
            <LoaderCircle className="size-3 animate-spin text-ink-muted" aria-hidden="true" />
          ) : (
            <Check className="size-3" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                item.kind === "revise"
                  ? "border-amber-500/30 bg-amber-500/[0.1] text-amber-700"
                  : "border-brand/25 bg-brand/10 text-brand-ink"
              )}
            >
              {item.kind === "revise" ? dict.learn.revisionsScheduled : dict.learn.openLesson}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] text-ink-muted">
              <Clock3 className="size-3" aria-hidden="true" />
              {formatNumber(item.duration_minutes, lang)} {dict.common.minutes}
            </span>
            {item.status === "rescheduled" ? (
              <span className="text-[11px] text-amber-700">{dict.learn.rescheduled}</span>
            ) : null}
            {skipped ? (
              <span className="text-[11px] text-ink-muted">{dict.learn.skipped}</span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-1 break-words text-[13px] font-medium",
              done ? "text-ink-muted line-through" : "text-ink"
            )}
          >
            {item.title}
          </p>
          {item.learning_objective ? (
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
              {item.learning_objective}
            </p>
          ) : null}
          {item.recommended_activity ? (
            <p className="mt-1 rounded-lg bg-black/[0.025] px-2 py-1 text-[11px] leading-relaxed text-ink-soft">
              {item.recommended_activity}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.lesson_id ? (
              <Link
                href={`/dashboard/lessons/${item.lesson_id}`}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline px-2 text-[11px] font-medium text-ink-soft hover:bg-black/[0.04]"
              >
                <BookOpen className="size-3" aria-hidden="true" />
                {dict.learn.openLesson}
              </Link>
            ) : null}
            <Link
              href={`/dashboard/tutor?prompt=${encodeURIComponent(
                item.learning_objective ?? item.title
              )}`}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline px-2 text-[11px] font-medium text-ink-soft hover:bg-black/[0.04]"
            >
              {dict.learn.askTeacher}
              <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
              <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/quizzes?create=1"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline px-2 text-[11px] font-medium text-ink-soft hover:bg-black/[0.04]"
            >
              {dict.learn.takeQuiz}
            </Link>
            {!done ? (
              <>
                <button
                  type="button"
                  onClick={() => onOpenReschedule(item)}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline px-2 text-[11px] font-medium text-ink-soft hover:bg-black/[0.04]"
                >
                  <Repeat className="size-3" aria-hidden="true" />
                  {dict.learn.reschedule}
                </button>
                <button
                  type="button"
                  onClick={() => onSkip(item.id)}
                  disabled={isBusy}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline px-2 text-[11px] font-medium text-ink-muted hover:bg-black/[0.04] disabled:opacity-50"
                >
                  {busy?.id === item.id && busy.action === "skip" ? (
                    <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <SkipForward className="size-3" aria-hidden="true" />
                  )}
                  {dict.learn.skip}
                </button>
              </>
            ) : null}
          </div>

          {rescheduleId === item.id ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-black/[0.02] p-2">
              <label className="text-[11px] font-medium text-ink-soft" htmlFor={`date-${item.id}`}>
                {dict.learn.newDate}
              </label>
              <input
                id={`date-${item.id}`}
                type="date"
                value={rescheduleDate}
                min={toDateKey(new Date())}
                onChange={(event) => onRescheduleDate(event.target.value)}
                className="h-8 rounded-lg border border-hairline bg-surface px-2 text-[12px] text-ink"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => onConfirmReschedule(item.id)}
                disabled={isBusy}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand px-2.5 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy?.id === item.id && busy.action === "reschedule" ? (
                  <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
                ) : null}
                {dict.learn.confirmReschedule}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function KindDot({ kind }: { kind: PlanItemRow["kind"] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-1.5 size-1.5 shrink-0 rounded-full",
        kind === "revise" ? "bg-amber-500" : "bg-brand"
      )}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-3.5">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="em-num mt-1 text-[20px] font-semibold text-ink" dir="auto">
        {value}
      </p>
    </div>
  );
}

export function TodayPlan({
  dict,
  lang,
  items,
}: {
  dict: AppMessages;
  lang: Lang;
  items: PlanItemRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const todayKey = toDateKey(new Date());
  const todayItems = items.filter((item) => item.planned_date === todayKey);

  function complete(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await completePlanItemAction(id);
      setBusyId(null);
      if (result.ok) {
        toast.success(result.message ?? dict.learn.itemCompleted);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-hairline/60 bg-surface-raised/80">
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{dict.learn.todayTitle}</h2>
          <p className="text-[12px] text-ink-muted">{dict.dashboard.todaysLearningBody}</p>
        </div>
        <Link
          href="/dashboard/study-plan#today"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-ink hover:opacity-80"
        >
          {dict.dashboard.viewFullPlan}
          <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
          <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
        </Link>
      </header>
      {todayItems.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] font-medium text-ink">{dict.dashboard.todaysLearningEmpty}</p>
          <Link
            href="/dashboard/study-plan"
            className="mt-3 inline-flex h-8 items-center rounded-lg border border-hairline px-3 text-[12px] font-medium text-ink-soft hover:bg-black/[0.04]"
          >
            {dict.learn.generatePlan}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-hairline/60">
          {todayItems.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 px-4 py-2.5">
              <button
                type="button"
                onClick={() => complete(item.id)}
                disabled={isPending && busyId === item.id}
                aria-label={dict.learn.markDone}
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                  item.status === "completed"
                    ? "border-brand bg-brand text-primary-foreground"
                    : "border-hairline-strong text-transparent hover:border-brand/60"
                )}
              >
                {busyId === item.id ? (
                  <LoaderCircle className="size-3 animate-spin text-ink-muted" aria-hidden="true" />
                ) : (
                  <Check className="size-3" aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "break-words text-[13px] font-medium",
                    item.status === "completed" ? "text-ink-muted line-through" : "text-ink"
                  )}
                >
                  {item.lesson_id ? (
                    <Link href={`/dashboard/lessons/${item.lesson_id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {formatNumber(item.duration_minutes, lang)} {dict.common.minutes}
                  {item.kind === "revise" ? ` · ${dict.learn.revisionsScheduled}` : ""}
                </p>
              </div>
              <Link
                href={`/dashboard/tutor?prompt=${encodeURIComponent(item.title)}`}
                className="shrink-0 text-[12px] font-medium text-brand-ink hover:opacity-80"
              >
                {dict.learn.askTeacher}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
