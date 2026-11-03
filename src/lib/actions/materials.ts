"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import type { ActionResult } from "@/lib/actions/types";

export async function deleteMaterialAction(materialId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { data: material } = await supabase
    .from("materials")
    .select("id, storage_path")
    .eq("id", materialId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!material) return { ok: false, error: dict.errors.forbidden };

  if (material.storage_path) {
    await supabase.storage.from("materials").remove([material.storage_path]);
  }

  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/materials");
  revalidatePath("/dashboard/summaries");
  revalidatePath("/dashboard/quizzes");
  revalidatePath("/dashboard/mind-maps");
  revalidatePath("/dashboard/progress");
  return { ok: true, message: dict.materials.deleteSuccess };
}

export async function deleteAllMaterialsAction(): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { data: materials } = await supabase
    .from("materials")
    .select("storage_path")
    .eq("user_id", user.id);

  const paths = (materials ?? []).map((row) => row.storage_path as string).filter(Boolean);

  if (paths.length > 0) {
    for (let i = 0; i < paths.length; i += 100) {
      await supabase.storage.from("materials").remove(paths.slice(i, i + 100));
    }
  }

  const { error } = await supabase.from("materials").delete().eq("user_id", user.id);
  if (error) return { ok: false, error: dict.errors.deleteFailed };

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: dict.settings.deleteAllSuccess };
}
