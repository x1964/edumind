"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Check, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveAcademicProfileAction, saveStudentSubjectsAction } from "@/lib/actions/learning";
import type { CatalogOption, StudentSubject } from "@/lib/learning/queries";
import type { AcademicProfile } from "@/lib/learning/planner";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

function minutesToTime(minutes: number): string {
  const value = Math.max(0, Math.min(1439, Math.round(minutes)));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 1020;
  return Math.max(0, Math.min(1439, hours * 60 + minutes));
}

export interface Catalog {
  systems: CatalogOption[];
  stages: CatalogOption[];
  grades: CatalogOption[];
  tracks: CatalogOption[];
  subjects: CatalogOption[];
}

type SubjectDraft = { examDate: string; priority: (typeof PRIORITIES)[number] };

export function AcademicProfileForm({
  dict,
  lang,
  catalog,
  profile,
  subjects,
}: {
  dict: AppMessages;
  lang: Lang;
  catalog: Catalog;
  profile: AcademicProfile | null;
  subjects: StudentSubject[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubjectsPending, startSubjectsTransition] = useTransition();

  const [systemId, setSystemId] = useState(profile?.system_id ?? "");
  const [stageId, setStageId] = useState(profile?.stage_id ?? "");
  const [gradeId, setGradeId] = useState(profile?.grade_id ?? "");
  const [trackId, setTrackId] = useState(profile?.track_id ?? "");
  const [academicYear, setAcademicYear] = useState(profile?.academic_year ?? "");
  const [dailyMinutes, setDailyMinutes] = useState(String(profile?.daily_minutes ?? 120));
  const [startTime, setStartTime] = useState(
    minutesToTime(profile?.preferred_start_minute ?? 1020)
  );
  const [studyDays, setStudyDays] = useState<number[]>(profile?.study_days ?? [0, 1, 2, 3, 4, 6]);
  const [goals, setGoals] = useState(profile?.goals ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);

  const initialSubjects = useMemo(() => {
    const map = new Map<string, SubjectDraft>();
    for (const subject of subjects) {
      map.set(subject.subjectId, {
        examDate: subject.examDate ?? "",
        priority: subject.priority,
      });
    }
    return map;
  }, [subjects]);

  const [selected, setSelected] = useState<Record<string, SubjectDraft>>(() =>
    Object.fromEntries(initialSubjects)
  );
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  const stages = catalog.stages.filter((stage) => !systemId || stage.parentId === systemId);
  const grades = catalog.grades.filter((grade) => !stageId || grade.parentId === stageId);
  const tracks = catalog.tracks.filter((track) => !gradeId || track.parentId === gradeId);
  const gradeSubjects = catalog.subjects.filter(
    (subject) => !gradeId || subject.parentId === gradeId
  );

  const selectedCount = Object.keys(selected).length;

  function name(option: { nameAr: string; nameEn: string }) {
    return lang === "ar" ? option.nameAr : option.nameEn;
  }

  function chooseSystem(value: string) {
    setSystemId(value);
    setStageId("");
    setGradeId("");
    setTrackId("");
  }

  function chooseStage(value: string) {
    setStageId(value);
    setGradeId("");
    setTrackId("");
  }

  function chooseGrade(value: string) {
    setGradeId(value);
    setTrackId("");
    const allowed = new Set(
      catalog.subjects.filter((subject) => !value || subject.parentId === value).map((s) => s.id)
    );
    setSelected((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => allowed.has(id)))
    );
  }

  function toggleDay(day: number) {
    setStudyDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort()
    );
  }

  function toggleSubject(subjectId: string) {
    setSelected((current) => {
      if (current[subjectId]) {
        const next = { ...current };
        delete next[subjectId];
        return next;
      }
      return { ...current, [subjectId]: { examDate: "", priority: "medium" } };
    });
  }

  function setSubjectField(subjectId: string, patch: Partial<SubjectDraft>) {
    setSelected((current) => ({
      ...current,
      [subjectId]: { ...(current[subjectId] ?? { examDate: "", priority: "medium" }), ...patch },
    }));
  }

  function saveProfile() {
    if (studyDays.length === 0) {
      setProfileError(dict.errors.invalidInput);
      return;
    }
    setProfileError(null);
    startTransition(async () => {
      const result = await saveAcademicProfileAction({
        systemId: systemId || null,
        stageId: stageId || null,
        gradeId: gradeId || null,
        trackId: trackId || null,
        academicYear: academicYear.trim() || null,
        dailyMinutes: Number(dailyMinutes) || 120,
        preferredStartMinute: timeToMinutes(startTime),
        studyDays,
        goals: goals.trim() || null,
        completed: true,
      });
      if (result.ok) {
        toast.success(result.message ?? dict.learn.profileSaved);
        router.refresh();
      } else {
        setProfileError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function saveSubjects() {
    setSubjectsError(null);
    startSubjectsTransition(async () => {
      const result = await saveStudentSubjectsAction(
        Object.entries(selected).map(([subjectId, value]) => ({
          subjectId,
          examDate: value.examDate || null,
          priority: value.priority,
        }))
      );
      if (result.ok) {
        toast.success(result.message ?? dict.learn.subjectsSaved);
        router.refresh();
      } else {
        setSubjectsError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  if (catalog.systems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline-strong/70 bg-surface-deep/40 px-6 py-10 text-center">
        <p className="text-[13px] text-ink-muted">{dict.learn.noCatalog}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-hairline bg-surface-raised/80">
        <header className="border-b border-hairline px-4 py-3 sm:px-5">
          <h2 className="text-[15px] font-semibold text-ink">{dict.learn.profileTitle}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">{dict.learn.profileBody}</p>
        </header>
        <div className="space-y-4 p-4 sm:p-5">
          {profileError ? <Alert message={profileError} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={dict.learn.systemLabel} htmlFor="system">
              <Select
                id="system"
                value={systemId}
                onChange={(event) => chooseSystem(event.target.value)}
              >
                <option value="">{dict.learn.selectPlaceholder}</option>
                {catalog.systems.map((option) => (
                  <option key={option.id} value={option.id}>
                    {name(option)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.stageLabel} htmlFor="stage">
              <Select
                id="stage"
                value={stageId}
                onChange={(event) => chooseStage(event.target.value)}
                disabled={stages.length === 0}
              >
                <option value="">{dict.learn.selectPlaceholder}</option>
                {stages.map((option) => (
                  <option key={option.id} value={option.id}>
                    {name(option)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.gradeLabel} htmlFor="grade">
              <Select
                id="grade"
                value={gradeId}
                onChange={(event) => chooseGrade(event.target.value)}
                disabled={grades.length === 0}
              >
                <option value="">{dict.learn.selectPlaceholder}</option>
                {grades.map((option) => (
                  <option key={option.id} value={option.id}>
                    {name(option)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.trackLabel} htmlFor="track">
              <Select
                id="track"
                value={trackId}
                onChange={(event) => setTrackId(event.target.value)}
                disabled={tracks.length === 0}
              >
                <option value="">{dict.common.none}</option>
                {tracks.map((option) => (
                  <option key={option.id} value={option.id}>
                    {name(option)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.academicYearLabel} htmlFor="academic-year">
              <Input
                id="academic-year"
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                maxLength={20}
                placeholder="2026/2027"
                dir="ltr"
              />
            </Field>
            <Field label={dict.learn.dailyMinutesLabel} htmlFor="daily-minutes">
              <Input
                id="daily-minutes"
                type="number"
                min={15}
                max={720}
                step={15}
                value={dailyMinutes}
                onChange={(event) => setDailyMinutes(event.target.value)}
                dir="ltr"
              />
            </Field>
            <Field label={dict.learn.startTimeLabel} htmlFor="start-time">
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                dir="ltr"
              />
            </Field>
          </div>

          <fieldset>
            <legend className="text-[13px] font-medium text-ink-soft">
              {dict.learn.studyDaysLabel}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_KEYS.map((day) => {
                const active = studyDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-medium transition-colors",
                      active
                        ? "border-brand/40 bg-brand/[0.1] text-brand-ink"
                        : "border-hairline bg-black/[0.02] text-ink-muted hover:border-hairline-strong"
                    )}
                  >
                    {active ? <Check className="size-3" aria-hidden="true" /> : null}
                    {dict.learn.weekdays[day]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field label={dict.learn.goalsLabel} htmlFor="goals">
            <Textarea
              id="goals"
              rows={2}
              maxLength={500}
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              placeholder={dict.learn.goalsHint}
            />
          </Field>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveProfile}
              disabled={isPending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {isPending ? dict.common.saving : dict.learn.saveProfile}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-hairline bg-surface-raised/80">
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-hairline px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{dict.learn.subjectsTitle}</h2>
            <p className="mt-0.5 max-w-xl text-[12px] text-ink-muted">{dict.learn.subjectsBody}</p>
          </div>
          <span className="rounded-full border border-hairline bg-black/[0.03] px-2.5 py-0.5 text-[12px] text-ink-muted">
            {selectedCount}
          </span>
        </header>
        <div className="space-y-4 p-4 sm:p-5">
          {subjectsError ? <Alert message={subjectsError} /> : null}
          {!gradeId ? (
            <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] text-ink-muted">
              {dict.learn.profileRequired}
            </p>
          ) : gradeSubjects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] text-ink-muted">
              {dict.learn.noCatalog}
            </p>
          ) : (
            <ul className="space-y-2">
              {gradeSubjects.map((subject) => {
                const draft = selected[subject.id];
                const active = Boolean(draft);
                return (
                  <li
                    key={subject.id}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 transition-colors",
                      active
                        ? "border-brand/30 bg-brand/[0.04]"
                        : "border-hairline bg-black/[0.015]"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSubject(subject.id)}
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                          active
                            ? "border-brand bg-brand text-primary-foreground"
                            : "border-hairline-strong text-transparent hover:border-brand/60"
                        )}
                      >
                        <Check className="size-3" aria-hidden="true" />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                        {name(subject)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[12px] text-ink-muted">
                        <CalendarDays className="size-3" aria-hidden="true" />
                        {dict.learn.examDateLabel}
                      </span>
                      <Input
                        type="date"
                        value={draft?.examDate ?? ""}
                        disabled={!active}
                        onChange={(event) =>
                          setSubjectField(subject.id, { examDate: event.target.value })
                        }
                        className="h-9 w-auto min-w-[9.5rem] text-[12px]"
                        dir="ltr"
                        aria-label={`${dict.learn.examDateLabel} — ${name(subject)}`}
                      />
                      <Select
                        value={draft?.priority ?? "medium"}
                        disabled={!active}
                        onChange={(event) =>
                          setSubjectField(subject.id, {
                            priority: event.target.value as (typeof PRIORITIES)[number],
                          })
                        }
                        className="h-9 w-auto min-w-[7rem] text-[12px]"
                        aria-label={`${dict.learn.priorityLabel} — ${name(subject)}`}
                      >
                        {PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {dict.common[priority]}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveSubjects}
              disabled={isSubjectsPending || !gradeId}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50"
            >
              {isSubjectsPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {isSubjectsPending ? dict.common.saving : dict.learn.saveSubjects}
            </button>
          </div>
        </div>
      </section>
    </div>
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
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
      {message}
    </p>
  );
}
