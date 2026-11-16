"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import type { ActionResult } from "@/lib/actions/types";

const saveAudioSchema = z.object({
  title: z.string().trim().min(1).max(160),
  transcript: z.string().trim().min(1).max(20_000),
  language: z.enum(["ar", "en"]),
  lessonId: z.string().uuid().nullable().optional(),
  threadId: z.string().uuid().nullable().optional(),
  durationSeconds: z.coerce.number().int().min(0).max(14400).nullable().optional(),
});

export async function saveAudioLessonAction(input: {
  title: string;
  transcript: string;
  language: "ar" | "en";
  lessonId?: string | null;
  threadId?: string | null;
  durationSeconds?: number | null;
}): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = saveAudioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audio_lessons")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      transcript: parsed.data.transcript,
      language: parsed.data.language,
      lesson_id: parsed.data.lessonId ?? null,
      thread_id: parsed.data.threadId ?? null,
      duration_seconds: parsed.data.durationSeconds ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: dict.errors.saveFailed };

  revalidatePath("/dashboard/listen");
  return { ok: true, id: data.id as string, message: dict.learn.transcriptSaved };
}

export async function deleteAudioLessonAction(audioId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("audio_lessons")
    .delete()
    .eq("id", audioId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard/listen");
  return { ok: true, message: dict.learn.transcriptDeleted };
}
