"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import type { ActionResult } from "@/lib/actions/types";

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
