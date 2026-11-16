import { describe, expect, it } from "vitest";
import {
  daysUntil,
  generateStudyPlan,
  generateSubjectPlan,
  toDateKey,
  type PlanGenerationInput,
  type PlannerSubject,
} from "@/lib/learning/planner";

const START = new Date(2026, 10, 16, 9, 0, 0); // Monday 16 Nov 2026
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function input(overrides: Partial<PlanGenerationInput> = {}): PlanGenerationInput {
  return {
    startDate: START,
    dailyMinutes: 120,
    studyDays: ALL_DAYS,
    subjects: [],
    revisions: [],
    horizonDays: 14,
    ...overrides,
  };
}

function subject(overrides: Partial<PlannerSubject> = {}): PlannerSubject {
  return {
    id: "subject-1",
    name: "History",
    examDate: "2026-11-26",
    priority: "high",
    lessons: [
      {
        id: "lesson-1",
        title: "The 1919 Revolution",
        objective: "Explain the causes and results.",
        difficulty: "medium",
        estimatedMinutes: 40,
        mastery: 0,
        position: 1,
      },
      {
        id: "lesson-2",
        title: "Constitutional life",
        objective: "Compare political parties.",
        difficulty: "hard",
        estimatedMinutes: 50,
        mastery: 0,
        position: 2,
      },
    ],
    ...overrides,
  };
}

describe("study planner", () => {
  it("computes date helpers without timezone drift", () => {
    expect(toDateKey(START)).toBe("2026-11-16");
    expect(daysUntil("2026-11-26", START)).toBe(10);
    expect(daysUntil(null, START)).toBeNull();
  });

  it("never schedules more than the daily available minutes", () => {
    const result = generateStudyPlan(
      input({
        subjects: [subject(), subject({ id: "subject-2", name: "Arabic", lessons: [] })],
      })
    );

    const perDay = new Map<string, number>();
    for (const item of result.items) {
      perDay.set(item.plannedDate, (perDay.get(item.plannedDate) ?? 0) + item.durationMinutes);
    }
    expect(result.items.length).toBeGreaterThan(0);
    for (const minutes of perDay.values()) expect(minutes).toBeLessThanOrEqual(120);
  });

  it("skips lessons that are already mastered", () => {
    const mastered = subject({
      lessons: [
        {
          id: "lesson-done",
          title: "Mastered lesson",
          objective: null,
          difficulty: "easy",
          estimatedMinutes: 30,
          mastery: 100,
          position: 1,
        },
      ],
    });

    const result = generateStudyPlan(input({ subjects: [mastered] }));
    expect(result.items.filter((item) => item.kind === "learn")).toHaveLength(0);
  });

  it("adds a final revision block before an exam", () => {
    const result = generateStudyPlan(input({ subjects: [subject()] }));
    const revision = result.items.find((item) => item.kind === "revise");
    expect(revision).toBeDefined();
    const examDay = new Date("2026-11-26T00:00:00");
    const gap = daysUntil(revision?.plannedDate ?? null, examDay);
    expect(gap).not.toBeNull();
    expect(gap!).toBeLessThanOrEqual(0);
    expect(gap!).toBeGreaterThanOrEqual(-2);
  });

  it("builds an honest subject-level fallback when no lessons exist", () => {
    const result = generateSubjectPlan(
      input({
        dailyMinutes: 60,
        subjects: [
          subject({ id: "subject-a", name: "Physics", examDate: "2026-11-21", lessons: [] }),
          subject({ id: "subject-b", name: "Chemistry", examDate: null, lessons: [] }),
        ],
      }),
      {
        studyTitle: (name) => `Study ${name}`,
        reviseTitle: (name) => `Revise ${name}`,
        studyObjective: (name) => `Study ${name}`,
        reviseObjective: (name) => `Revise ${name}`,
        studyActivity: "Active reading.",
        reviseActivity: "Active recall.",
      }
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.lessonId === null)).toBe(true);
    expect(result.items.some((item) => item.kind === "revise")).toBe(true);
    expect(result.summary.subjectsCovered).toBe(2);

    const perDay = new Map<string, number>();
    for (const item of result.items) {
      perDay.set(item.plannedDate, (perDay.get(item.plannedDate) ?? 0) + item.durationMinutes);
    }
    for (const minutes of perDay.values()) expect(minutes).toBeLessThanOrEqual(60);
  });
});
