"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarClock, Check, Clock3, LoaderCircle, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/lib/actions/planner";
import { formatDate, formatNumber } from "@/lib/format";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import type { StudyTask, TaskPriority } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

interface TaskFormState {
  title: string;
  description: string;
  subject: string;
  materialId: string;
  dueDate: string;
  priority: TaskPriority;
  estimatedMinutes: string;
}

const EMPTY_FORM: TaskFormState = {
  title: "",
  description: "",
  subject: "",
  materialId: "",
  dueDate: "",
  priority: "medium",
  estimatedMinutes: "",
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function PlannerBoard({
  tasks,
  materials,
  dict,
  lang,
  defaultOpen = false,
}: {
  tasks: StudyTask[];
  materials: Array<{ id: string; file_name: string }>;
  dict: AppMessages;
  lang: Lang;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState<StudyTask | null>(null);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const today = startOfDay(new Date());

  const overdue = tasks.filter(
    (task) => !task.completed && task.due_date && new Date(task.due_date) < today
  );
  const dueToday = tasks.filter(
    (task) =>
      !task.completed &&
      task.due_date &&
      startOfDay(new Date(task.due_date)).getTime() === today.getTime()
  );
  const upcoming = tasks.filter(
    (task) =>
      !task.completed &&
      (!task.due_date || new Date(task.due_date) >= new Date(today.getTime() + 86_400_000))
  );
  const completed = tasks.filter((task) => task.completed);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(task: StudyTask) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      subject: task.subject ?? "",
      materialId: task.material_id ?? "",
      dueDate: toLocalInput(task.due_date),
      priority: task.priority,
      estimatedMinutes: task.estimated_minutes ? String(task.estimated_minutes) : "",
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    if (form.title.trim().length < 2) {
      setError(dict.errors.invalidInput);
      return;
    }
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      subject: form.subject,
      materialId: form.materialId || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      priority: form.priority,
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
    };

    startTransition(async () => {
      const result = editing
        ? await updateTaskAction(editing.id, payload)
        : await createTaskAction(payload);
      if (result.ok) {
        if (!editing) {
          trackEvent("study_plan_created");
        }
        toast.success(result.message ?? dict.planner.success);
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? dict.planner.failed);
      }
    });
  }

  function toggle(task: StudyTask) {
    setTogglingId(task.id);
    startTransition(async () => {
      const result = await toggleTaskAction(task.id, !task.completed);
      setTogglingId(null);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? dict.planner.failed);
      }
    });
  }

  const plannedMinutes = tasks
    .filter((task) => !task.completed)
    .reduce((sum, task) => sum + (task.estimated_minutes ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={dict.planner.today}
          value={formatNumber(dueToday.length + overdue.length, lang)}
        />
        <StatCard label={dict.planner.upcoming} value={formatNumber(upcoming.length, lang)} />
        <StatCard label={dict.planner.minutesPlanned} value={formatNumber(plannedMinutes, lang)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-ink">{dict.planner.allTasks}</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
        >
          <Plus className="size-4" aria-hidden="true" />
          {dict.planner.addTask}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface-deep/40 px-6 py-12 text-center">
          <CalendarClock className="mx-auto size-6 text-brand-ink" aria-hidden="true" />
          <h3 className="mt-3 text-[14px] font-semibold text-ink">{dict.planner.empty}</h3>
          <p className="mt-1.5 text-[12px] text-ink-muted">{dict.planner.emptyBody}</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {dict.planner.addTask}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <TaskSection
            title={dict.planner.overdue}
            tone="danger"
            tasks={overdue}
            dict={dict}
            lang={lang}
            onEdit={openEdit}
            onToggle={toggle}
            togglingId={togglingId}
          />
          <TaskSection
            title={dict.planner.today}
            tasks={dueToday}
            dict={dict}
            lang={lang}
            onEdit={openEdit}
            onToggle={toggle}
            togglingId={togglingId}
          />
          <TaskSection
            title={dict.planner.upcoming}
            tasks={upcoming}
            dict={dict}
            lang={lang}
            onEdit={openEdit}
            onToggle={toggle}
            togglingId={togglingId}
          />
          <TaskSection
            title={dict.planner.completed}
            tasks={completed}
            dict={dict}
            lang={lang}
            onEdit={openEdit}
            onToggle={toggle}
            togglingId={togglingId}
            muted
          />
        </div>
      )}

      <Modal
        open={open}
        onClose={() => (isPending ? null : setOpen(false))}
        title={editing ? dict.planner.editTask : dict.planner.addTask}
        closeLabel={dict.common.close}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-9 rounded-xl border border-hairline px-3.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:opacity-50"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? dict.planner.saving : dict.planner.save}
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          {error ? (
            <p className="rounded-lg border border-[#ef4444]/25 bg-[#ef4444]/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          ) : null}

          <Field label={dict.planner.titleLabel} htmlFor="task-title">
            <input
              id="task-title"
              value={form.title}
              onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
              maxLength={160}
              placeholder={dict.planner.titleLabel}
              className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink placeholder:text-ink-muted/70 focus:border-brand/50 focus:outline-none"
            />
          </Field>

          <Field label={dict.planner.description} htmlFor="task-description">
            <textarea
              id="task-description"
              value={form.description}
              onChange={(event) =>
                setForm((state) => ({ ...state, description: event.target.value }))
              }
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-hairline bg-surface-deep px-3 py-2 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={dict.planner.subject} htmlFor="task-subject">
              <input
                id="task-subject"
                value={form.subject}
                onChange={(event) =>
                  setForm((state) => ({ ...state, subject: event.target.value }))
                }
                maxLength={80}
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              />
            </Field>
            <Field label={dict.planner.dueDate} htmlFor="task-due">
              <input
                id="task-due"
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((state) => ({ ...state, dueDate: event.target.value }))
                }
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              />
            </Field>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={dict.planner.priority} htmlFor="task-priority">
              <select
                id="task-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((state) => ({ ...state, priority: event.target.value as TaskPriority }))
                }
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {dict.common[priority]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={dict.planner.estimatedMinutes} htmlFor="task-minutes">
              <input
                id="task-minutes"
                type="number"
                min={5}
                max={1440}
                value={form.estimatedMinutes}
                onChange={(event) =>
                  setForm((state) => ({ ...state, estimatedMinutes: event.target.value }))
                }
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              />
            </Field>
          </div>

          {materials.length > 0 ? (
            <Field label={dict.summaries.materialLabel} htmlFor="task-material">
              <select
                id="task-material"
                value={form.materialId}
                onChange={(event) =>
                  setForm((state) => ({ ...state, materialId: event.target.value }))
                }
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              >
                <option value="">{dict.common.none}</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.file_name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-4">
      <p className="text-[12px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-[22px] font-semibold text-ink" dir="auto">
        {value}
      </p>
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  dict,
  lang,
  onEdit,
  onToggle,
  togglingId,
  tone,
  muted = false,
}: {
  title: string;
  tasks: StudyTask[];
  dict: AppMessages;
  lang: Lang;
  onEdit: (task: StudyTask) => void;
  onToggle: (task: StudyTask) => void;
  togglingId: string | null;
  tone?: "danger";
  muted?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface-raised/80">
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-1.5 rounded-full",
              tone === "danger" ? "bg-[#ef4444]" : muted ? "bg-ink-muted" : "bg-brand"
            )}
            aria-hidden="true"
          />
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        </div>
        <span className="text-[12px] text-ink-muted">
          {dict.planner.tasksCount.replace("{count}", String(tasks.length))}
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="px-4 py-5 text-center text-[12px] text-ink-muted">
          {tone === "danger"
            ? dict.planner.noToday
            : muted
              ? dict.planner.noCompleted
              : title === dict.planner.today
                ? dict.planner.noToday
                : dict.planner.noUpcoming}
        </p>
      ) : (
        <ul className="divide-y divide-hairline/60">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-2.5 px-4 py-2.5">
              <button
                type="button"
                onClick={() => onToggle(task)}
                disabled={togglingId === task.id}
                aria-label={task.completed ? dict.planner.uncomplete : dict.planner.complete}
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                  task.completed
                    ? "border-brand bg-brand text-primary-foreground"
                    : "border-hairline-strong text-transparent hover:border-brand/60"
                )}
              >
                {togglingId === task.id ? (
                  <LoaderCircle className="size-3 animate-spin text-ink-muted" aria-hidden="true" />
                ) : task.completed ? (
                  <Check className="size-3" aria-hidden="true" />
                ) : (
                  <Check className="size-3" aria-hidden="true" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "break-words text-[13px] font-medium",
                    task.completed ? "text-ink-muted line-through" : "text-ink"
                  )}
                >
                  {task.title}
                </p>
                {task.description ? (
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">
                    {task.description}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
                  {task.subject ? <span>{task.subject}</span> : null}
                  {task.due_date ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-2.5" aria-hidden="true" />
                      {formatDate(task.due_date, lang)}
                    </span>
                  ) : (
                    <span>{dict.planner.noDueDate}</span>
                  )}
                  {task.estimated_minutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-2.5" aria-hidden="true" />
                      {formatNumber(task.estimated_minutes, lang)} {dict.common.minutes}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      task.priority === "high"
                        ? "text-danger"
                        : task.priority === "low"
                          ? "text-ink-muted"
                          : "text-brand-ink"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1 rounded-full",
                        task.priority === "high"
                          ? "bg-[#ef4444]"
                          : task.priority === "low"
                            ? "bg-ink-muted"
                            : "bg-brand"
                      )}
                      aria-hidden="true"
                    />
                    {dict.common[task.priority]}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  aria-label={dict.common.edit}
                  className="grid size-7 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <ConfirmAction
                  action={deleteTaskAction.bind(null, task.id)}
                  title={dict.planner.deleteTitle}
                  description={dict.planner.deleteBody}
                  confirmLabel={dict.common.delete}
                  cancelLabel={dict.common.cancel}
                  successMessage={dict.planner.deleteSuccess}
                  iconOnly
                  className="size-7"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[12px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}
