"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";
import type { ActionResult } from "@/lib/actions/types";

export async function setLanguageAction(lang: Lang): Promise<ActionResult> {
  if (!isLang(lang)) return { ok: false, error: "Invalid language" };

  const store = await cookies();
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user) {
      const supabase = await createSupabaseServerClient();
      await supabase.from("profiles").update({ learning_language: lang }).eq("id", user.id);
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
