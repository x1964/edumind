import { z } from "zod";

export const summaryOutputSchema = z.object({
  title: z.string().min(2).max(160),
  content: z.string().min(20).max(20000),
});

export const quizOutputSchema = z.object({
  title: z.string().min(2).max(160),
  questions: z
    .array(
      z.object({
        type: z.enum(["multiple_choice", "true_false", "short_answer"]),
        prompt: z.string().min(5).max(600),
        options: z.array(z.string().min(1).max(240)).max(6).optional().default([]),
        correctAnswer: z.string().min(1).max(500),
        explanation: z.string().max(800).optional().default(""),
      })
    )
    .min(1)
    .max(20),
});

export const mindMapOutputSchema = z.object({
  title: z.string().min(2).max(160),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        label: z.string().min(1).max(160),
        kind: z.enum(["root", "branch", "leaf"]),
      })
    )
    .min(3)
    .max(40),
  edges: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        source: z.string().min(1).max(40),
        target: z.string().min(1).max(40),
      })
    )
    .min(2)
    .max(80),
});

export const flashcardOutputSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z.string().min(3).max(300),
        back: z.string().min(3).max(1000),
      })
    )
    .min(3)
    .max(30),
});

export const lessonPlanOutputSchema = z.object({
  title: z.string().min(2).max(160),
  objectives: z.array(z.string().min(3).max(300)).min(2).max(8),
  activities: z
    .array(
      z.object({
        title: z.string().min(2).max(120),
        minutes: z.number().int().min(1).max(120),
        instructions: z.string().min(5).max(800),
      })
    )
    .min(2)
    .max(8),
  assessment: z.string().min(5).max(800),
});

export const teacherDailyReportOutputSchema = z.object({
  summary: z.string().min(10).max(1200),
  highlights: z.array(z.string().min(3).max(300)).max(6),
  risks: z.array(z.string().min(3).max(300)).max(6),
  recommendations: z.array(z.string().min(3).max(300)).max(6),
});

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
export type QuizOutput = z.infer<typeof quizOutputSchema>;
export type MindMapOutput = z.infer<typeof mindMapOutputSchema>;
export type FlashcardOutput = z.infer<typeof flashcardOutputSchema>;
export type LessonPlanOutput = z.infer<typeof lessonPlanOutputSchema>;
export type TeacherDailyReportOutput = z.infer<typeof teacherDailyReportOutputSchema>;
