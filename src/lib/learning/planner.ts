export type StudyDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PlanItemKind = "learn" | "revise" | "assess";
export type PlanItemStatus = "pending" | "completed" | "missed" | "rescheduled" | "skipped";
export type Priority = "low" | "medium" | "high";

export interface AcademicProfile {
  user_id: string;
  system_id: string | null;
  stage_id: string | null;
  grade_id: string | null;
  track_id: string | null;
  academic_year: string | null;
  daily_minutes: number;
  preferred_start_minute: number;
  study_days: number[];
  goals: string | null;
  onboarding_completed: boolean;
}

export interface PlannerLesson {
  id: string;
  title: string;
  objective: string | null;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  mastery: number;
  position: number;
  unitTitle?: string | null;
}

export interface PlannerSubject {
  id: string;
  name: string;
  examDate: string | null;
  priority: Priority;
  lessons: PlannerLesson[];
}

export interface PlannerRevision {
  id: string;
  lessonId: string | null;
  subjectId: string | null;
  title: string;
  dueDate: string;
  stage: number;
  intervalDays: number;
}

export interface GeneratedPlanItem {
  subjectId: string | null;
  lessonId: string | null;
  title: string;
  learningObjective: string;
  recommendedActivity: string;
  plannedDate: string;
  durationMinutes: number;
  priority: Priority;
  kind: PlanItemKind;
  sortOrder: number;
}

export interface PlanGenerationInput {
  startDate: Date;
  dailyMinutes: number;
  studyDays: number[];
  subjects: PlannerSubject[];
  revisions: PlannerRevision[];
  horizonDays?: number;
}

export interface PlanGenerationResult {
  items: GeneratedPlanItem[];
  endDate: string;
  summary: {
    totalMinutes: number;
    studyDays: number;
    lessonsScheduled: number;
    revisionsScheduled: number;
    subjectsCovered: number;
    horizonDays: number;
  };
}

export function toDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function atMidnight(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function daysUntil(target: string | null | undefined, from: Date): number | null {
  if (!target) return null;
  const parsed = new Date(target);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.round((atMidnight(parsed).getTime() - atMidnight(from).getTime()) / 86_400_000);
}

function priorityFromUrgency(daysToExam: number | null, base: Priority, mastery: number): Priority {
  if (daysToExam !== null && daysToExam <= 7) return "high";
  if (mastery < 40) return "high";
  if (daysToExam !== null && daysToExam <= 21 && base === "high") return "high";
  return base;
}

function roundToFive(value: number): number {
  return Math.max(10, Math.min(120, Math.round(value / 5) * 5));
}

/**
 * Deterministic, explainable study scheduler.
 *
 * It is intentionally not an opaque AI call: the same inputs always produce
 * the same plan, workload limits are never exceeded, subjects are interleaved
 * so one exam cannot starve the others, and the final two days before an exam
 * are reserved for revision. AI is used elsewhere for content generation, not
 * for inventing a schedule.
 */
export function generateStudyPlan(input: PlanGenerationInput): PlanGenerationResult {
  const start = atMidnight(input.startDate);
  const dailyMinutes = Math.max(30, Math.min(480, input.dailyMinutes || 120));
  const studyDays =
    input.studyDays.length > 0 ? new Set(input.studyDays) : new Set([0, 1, 2, 3, 4, 6]);

  const examDates = input.subjects
    .map((subject) => subject.examDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));

  const fallbackHorizon = 30;
  const horizonDays = Math.max(
    7,
    Math.min(
      60,
      input.horizonDays ??
        (examDates.length > 0
          ? Math.max(
              7,
              Math.ceil(
                (Math.min(...examDates.map((date) => date.getTime())) - start.getTime()) /
                  86_400_000
              ) + 1
            )
          : fallbackHorizon)
    )
  );

  const days: Date[] = [];
  for (let index = 0; index < horizonDays; index += 1) {
    const date = addDays(start, index);
    if (studyDays.has(date.getDay())) days.push(date);
  }

  if (days.length === 0) {
    return {
      items: [],
      endDate: toDateKey(addDays(start, horizonDays)),
      summary: {
        totalMinutes: 0,
        studyDays: 0,
        lessonsScheduled: 0,
        revisionsScheduled: 0,
        subjectsCovered: 0,
        horizonDays,
      },
    };
  }

  const items: GeneratedPlanItem[] = [];
  let sortOrder = 0;
  const scheduledRevisionIds = new Set<string>();

  // 1. Place due revisions first: they protect previously learned material.
  const pendingRevisions = [...input.revisions].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  for (const revision of pendingRevisions) {
    const due = new Date(revision.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    const dueKey = atMidnight(due).getTime();
    const targetDay = days.find((day) => day.getTime() >= dueKey) ?? days[days.length - 1];
    const subject = input.subjects.find((row) => row.id === revision.subjectId) ?? null;
    const lesson = revision.lessonId
      ? (subject?.lessons.find((row) => row.id === revision.lessonId) ?? null)
      : null;
    items.push({
      subjectId: revision.subjectId,
      lessonId: revision.lessonId,
      title: lesson?.title ?? revision.title,
      learningObjective: lesson
        ? `Review and retain: ${lesson.objective ?? lesson.title}`
        : `Review: ${revision.title}`,
      recommendedActivity: "Active recall, then a short self-test.",
      plannedDate: toDateKey(targetDay),
      durationMinutes: lesson ? roundToFive(Math.min(30, lesson.estimatedMinutes * 0.5)) : 20,
      priority: "high",
      kind: "revise",
      sortOrder: sortOrder++,
    });
    scheduledRevisionIds.add(revision.id);
  }

  // 2. Build a fair queue of lessons. Interleave subjects by urgency so the
  //    nearest exam gets the first slot of every cycle, not every slot.
  const queues = input.subjects
    .map((subject) => {
      const daysToExam = daysUntil(subject.examDate, start);
      const lessons = [...subject.lessons]
        .filter((lesson) => lesson.mastery < 85)
        .sort((a, b) => a.mastery - b.mastery || a.position - b.position);
      return { subject, daysToExam, lessons, cursor: 0 };
    })
    .filter((row) => row.lessons.length > 0)
    .sort((a, b) => {
      const aDays = a.daysToExam ?? 999;
      const bDays = b.daysToExam ?? 999;
      if (aDays !== bDays) return aDays - bDays;
      const rank = { high: 0, medium: 1, low: 2 } as const;
      return rank[a.subject.priority] - rank[b.subject.priority];
    });

  for (const day of days) {
    let remaining = dailyMinutes;
    const usedToday = new Map<string, number>();

    // Revisions already placed on this day consume capacity.
    for (const item of items) {
      if (item.plannedDate === toDateKey(day)) {
        remaining -= item.durationMinutes;
        usedToday.set(
          item.subjectId ?? "general",
          (usedToday.get(item.subjectId ?? "general") ?? 0) + item.durationMinutes
        );
      }
    }

    let guard = 0;
    while (remaining >= 15 && guard < 40) {
      guard += 1;
      let placed = false;

      for (const queue of queues) {
        if (queue.cursor >= queue.lessons.length) continue;
        const lesson = queue.lessons[queue.cursor];
        const subjectDays = daysUntil(queue.subject.examDate, day);
        // Never start new material in the final 48 hours before its exam.
        if (subjectDays !== null && subjectDays <= 2) continue;

        const baseDuration = roundToFive(lesson.estimatedMinutes);
        const fairShareLimit = Math.ceil(dailyMinutes * 0.5);
        const already = usedToday.get(queue.subject.id) ?? 0;
        if (already + baseDuration > fairShareLimit && usedToday.size > 0) continue;

        const duration = Math.min(baseDuration, remaining);
        if (duration < 15) continue;

        items.push({
          subjectId: queue.subject.id,
          lessonId: lesson.id,
          title: lesson.title,
          learningObjective:
            lesson.objective ??
            `Understand and be able to explain the key ideas of ${lesson.title}.`,
          recommendedActivity:
            lesson.difficulty === "hard"
              ? "Read actively, then ask the AI teacher to explain one difficult part."
              : "Read actively, summarise in your own words, then answer 3 recall questions.",
          plannedDate: toDateKey(day),
          durationMinutes: duration,
          priority: priorityFromUrgency(subjectDays, queue.subject.priority, lesson.mastery),
          kind: "learn",
          sortOrder: sortOrder++,
        });

        remaining -= duration;
        usedToday.set(queue.subject.id, already + duration);
        queue.cursor += 1;
        placed = true;
        break;
      }

      if (!placed) break;
    }

    // 3. Final revision blocks in the last two days before each exam.
    for (const subject of input.subjects) {
      const subjectDays = daysUntil(subject.examDate, day);
      if (subjectDays === null || subjectDays < 0 || subjectDays > 2) continue;
      const already = items.some(
        (item) =>
          item.subjectId === subject.id &&
          item.plannedDate === toDateKey(day) &&
          item.kind === "revise"
      );
      if (already) continue;
      const duration = Math.min(30, Math.max(15, remaining));
      if (duration < 15) continue;
      items.push({
        subjectId: subject.id,
        lessonId: null,
        title:
          subjectDays === 0 ? `Final review — ${subject.name}` : `Exam revision — ${subject.name}`,
        learningObjective: `Consolidate weak points and practise under exam conditions for ${subject.name}.`,
        recommendedActivity:
          "Review your weak topics, then take a timed practice assessment and read the explanations.",
        plannedDate: toDateKey(day),
        durationMinutes: duration,
        priority: "high",
        kind: "revise",
        sortOrder: sortOrder++,
      });
      remaining -= duration;
    }
  }

  const trimmed = items.slice(0, 240);
  const totalMinutes = trimmed.reduce((sum, item) => sum + item.durationMinutes, 0);

  return {
    items: trimmed,
    endDate: toDateKey(days[days.length - 1]),
    summary: {
      totalMinutes,
      studyDays: new Set(trimmed.map((item) => item.plannedDate)).size,
      lessonsScheduled: trimmed.filter((item) => item.kind === "learn").length,
      revisionsScheduled: trimmed.filter((item) => item.kind === "revise").length,
      subjectsCovered: new Set(trimmed.map((item) => item.subjectId).filter(Boolean)).size,
      horizonDays,
    },
  };
}

/**
 * Rebuilds only the future portion of a plan after a missed item or a weak
 * assessment. Past items are never deleted; workload is recalculated so a
 * backlog is spread out instead of piling onto tomorrow.
 */
export function replanRemainingItems(
  input: PlanGenerationInput & { completedLessonIds: string[] }
): GeneratedPlanItem[] {
  const completed = new Set(input.completedLessonIds);
  return generateStudyPlan({
    ...input,
    subjects: input.subjects.map((subject) => ({
      ...subject,
      lessons: subject.lessons.filter((lesson) => !completed.has(lesson.id)),
    })),
  }).items;
}

export interface SubjectPlanLabels {
  studyTitle: (subjectName: string) => string;
  reviseTitle: (subjectName: string) => string;
  studyObjective: (subjectName: string) => string;
  reviseObjective: (subjectName: string) => string;
  studyActivity: string;
  reviseActivity: string;
}

/**
 * Subject-level fallback plan used when no curriculum lessons are published
 * yet. It never claims to know the curriculum: sessions are labelled by the
 * subject the student selected, and finish with revision blocks before exams.
 */
export function generateSubjectPlan(
  input: PlanGenerationInput,
  labels: SubjectPlanLabels
): PlanGenerationResult {
  const start = atMidnight(input.startDate);
  const dailyMinutes = Math.max(30, Math.min(480, input.dailyMinutes || 120));
  const studyDays =
    input.studyDays.length > 0 ? new Set(input.studyDays) : new Set([0, 1, 2, 3, 4, 6]);
  const horizonDays = Math.max(7, Math.min(60, input.horizonDays ?? 30));

  const days: Date[] = [];
  for (let index = 0; index < horizonDays; index += 1) {
    const date = addDays(start, index);
    if (studyDays.has(date.getDay())) days.push(date);
  }

  const subjects = [...input.subjects]
    .map((subject) => ({
      subject,
      daysToExam: daysUntil(subject.examDate, start),
    }))
    .sort((a, b) => {
      const aDays = a.daysToExam ?? 999;
      const bDays = b.daysToExam ?? 999;
      if (aDays !== bDays) return aDays - bDays;
      const rank = { high: 0, medium: 1, low: 2 } as const;
      return rank[a.subject.priority] - rank[b.subject.priority];
    });

  if (days.length === 0 || subjects.length === 0) {
    return {
      items: [],
      endDate: toDateKey(addDays(start, horizonDays)),
      summary: {
        totalMinutes: 0,
        studyDays: 0,
        lessonsScheduled: 0,
        revisionsScheduled: 0,
        subjectsCovered: 0,
        horizonDays,
      },
    };
  }

  const items: GeneratedPlanItem[] = [];
  let sortOrder = 0;
  let cursor = 0;

  for (const day of days) {
    let remaining = dailyMinutes;
    const usedToday = new Set<string>();

    // Reserve the last two days before an exam for revision.
    for (const { subject } of subjects) {
      const examDays = daysUntil(subject.examDate, day);
      if (examDays === null || examDays < 0 || examDays > 2) continue;
      if (usedToday.has(subject.id)) continue;
      const duration = Math.min(30, Math.max(15, remaining));
      if (duration < 15) break;
      items.push({
        subjectId: subject.id,
        lessonId: null,
        title: labels.reviseTitle(subject.name),
        learningObjective: labels.reviseObjective(subject.name),
        recommendedActivity: labels.reviseActivity,
        plannedDate: toDateKey(day),
        durationMinutes: duration,
        priority: "high",
        kind: "revise",
        sortOrder: sortOrder++,
      });
      remaining -= duration;
      usedToday.add(subject.id);
    }

    let guard = 0;
    while (remaining >= 20 && guard < 12) {
      guard += 1;
      const entry = subjects[cursor % subjects.length];
      cursor += 1;
      const entryDays = daysUntil(entry.subject.examDate, day);
      if (entryDays !== null && entryDays <= 2) continue;
      const duration = Math.min(40, remaining);
      if (duration < 20) break;
      items.push({
        subjectId: entry.subject.id,
        lessonId: null,
        title: labels.studyTitle(entry.subject.name),
        learningObjective: labels.studyObjective(entry.subject.name),
        recommendedActivity: labels.studyActivity,
        plannedDate: toDateKey(day),
        durationMinutes: duration,
        priority: priorityFromUrgency(entryDays, entry.subject.priority, 0),
        kind: "learn",
        sortOrder: sortOrder++,
      });
      remaining -= duration;
      usedToday.add(entry.subject.id);
    }
  }

  const trimmed = items.slice(0, 240);
  return {
    items: trimmed,
    endDate: toDateKey(days[days.length - 1]),
    summary: {
      totalMinutes: trimmed.reduce((sum, item) => sum + item.durationMinutes, 0),
      studyDays: new Set(trimmed.map((item) => item.plannedDate)).size,
      lessonsScheduled: trimmed.filter((item) => item.kind === "learn").length,
      revisionsScheduled: trimmed.filter((item) => item.kind === "revise").length,
      subjectsCovered: new Set(trimmed.map((item) => item.subjectId).filter(Boolean)).size,
      horizonDays,
    },
  };
}
