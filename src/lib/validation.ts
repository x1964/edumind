import { z } from "zod";

/** Prevents open redirects: only same-origin absolute paths are allowed. */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return fallback;
  return value;
}

export const emailSchema = z.string().trim().min(1).email().max(254);

export const passwordSchema = z.string().min(8, "password_too_short").max(128, "password_too_long");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "password_required").max(128),
  remember: z.boolean().optional().default(true),
  next: z.string().optional(),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "name_too_short").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: "terms_required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwords_do_not_match",
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwords_do_not_match",
  });

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "invalid_username");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{7,18}$/, "invalid_phone")
  .transform((value) => value.replace(/[\s-]/g, ""));

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "name_too_short").max(80),
  username: usernameSchema,
  phone: phoneSchema,
  educationLevel: z.enum(["school", "university", "independent"]),
  interests: z.array(z.string()).min(1).max(8),
  goals: z.array(z.string()).min(1).max(5),
  learningLanguage: z.enum(["ar", "en"]),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  educationLevel: z.enum(["school", "university", "independent"]).nullable(),
  interests: z.array(z.string()).max(8),
  goals: z.array(z.string()).max(5),
  learningLanguage: z.enum(["ar", "en"]),
  theme: z.enum(["dark", "light", "system"]),
  notifications: z.object({
    email: z.boolean(),
    study_reminders: z.boolean(),
  }),
});

export const summaryStyleSchema = z.enum([
  "short",
  "detailed",
  "key_points",
  "exam_revision",
  "simplified",
]);

export const quizDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const quizCountSchema = z.coerce.number().int().min(3).max(20);

export const quizAnswersSchema = z
  .record(z.string().uuid(), z.string().trim().max(4000))
  .refine((answers) => Object.keys(answers).length <= 100, "too_many_answers");

export const studyTaskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().default(""),
  subject: z.string().trim().max(80).optional().default(""),
  materialId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedMinutes: z.coerce.number().int().min(5).max(1440).nullable().optional(),
});

export const mindMapSchema = z.object({
  title: z.string().trim().min(2).max(160),
  materialId: z.string().uuid().nullable().optional(),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        label: z.string().min(1).max(240),
        kind: z.enum(["root", "branch", "leaf"]),
        summary: z.string().max(300).optional(),
        tone: z.enum(["emerald", "sky", "violet", "amber", "rose", "cyan"]).optional(),
        position: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
      })
    )
    .min(2)
    .max(60),
  edges: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        source: z.string().min(1).max(80),
        target: z.string().min(1).max(80),
      })
    )
    .max(120),
});
