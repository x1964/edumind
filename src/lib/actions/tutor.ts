"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import { isAnalyticsEventName, type AnalyticsEventName } from "@/lib/analytics";
import type { ActionResult } from "@/lib/actions/types";

async function trackServerEvent(name: AnalyticsEventName): Promise<void> {
  if (!isAnalyticsEventName(name)) return;
  try {
    const { track } = await import("@vercel/analytics/server");
    await track(name);
  } catch {
    // Analytics must never break tutor session flows.
  }
}

export async function createTutorThreadAction(materialId: string | null): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();

  if (materialId) {
    const { data: material } = await supabase
      .from("materials")
      .select("id")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!material) return { ok: false, error: dict.materials.notFound };
  }

  const { data, error } = await supabase
    .from("tutor_threads")
    .insert({
      user_id: user.id,
      material_id: materialId,
      title: dict.tutor.untitled,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: dict.errors.saveFailed };

  // A tutor session thread was created successfully — emit a privacy-safe event.
  await trackServerEvent("tutor_session_started");

  revalidatePath("/dashboard/tutor");
  return { ok: true, id: data.id as string };
}

export async function deleteTutorThreadAction(threadId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tutor_threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard/tutor");
  return { ok: true, message: dict.tutor.threadDeleted };
}

/**
 * Switches the source material of an existing conversation without losing its
 * history. A system message is recorded so the change is visible as a divider
 * when the conversation is reloaded.
 */
export async function updateTutorThreadMaterialAction(
  threadId: string,
  materialId: string | null
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();

  const { data: thread } = await supabase
    .from("tutor_threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!thread) return { ok: false, error: dict.tutor.materialNotFound };

  let materialName: string | null = null;
  if (materialId) {
    const { data: material } = await supabase
      .from("materials")
      .select("id, file_name")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .eq("status", "ready")
      .maybeSingle();
    if (!material) return { ok: false, error: dict.tutor.materialNotFound };
    materialName = material.file_name as string;
  }

  const { error } = await supabase
    .from("tutor_threads")
    .update({ material_id: materialId, updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: dict.errors.saveFailed };

  const { count: messageCount } = await supabase
    .from("tutor_messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", threadId)
    .eq("user_id", user.id);

  if ((messageCount ?? 0) > 0) {
    const { error: markerError } = await supabase.from("tutor_messages").insert({
      thread_id: threadId,
      user_id: user.id,
      role: "system",
      content: materialName ?? "",
      citations: { kind: "source_change", materialId, materialName },
    });
    if (markerError) {
      console.error("[tutor] source change marker failed", markerError.message);
    }
  }

  revalidatePath("/dashboard/tutor");
  return { ok: true, message: dict.tutor.sourceUpdated };
}

/**
 * Clears every message in a conversation while keeping the thread itself, so
 * the user can start a fresh line of questioning in the same session.
 */
export async function clearTutorThreadAction(threadId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();

  const { error: messagesError } = await supabase
    .from("tutor_messages")
    .delete()
    .eq("thread_id", threadId)
    .eq("user_id", user.id);

  if (messagesError) return { ok: false, error: dict.errors.deleteFailed };

  await supabase
    .from("tutor_threads")
    .update({ title: dict.tutor.untitled, updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/tutor");
  return { ok: true, message: dict.tutor.cleared };
}
