import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { selectContext } from "@/lib/documents/extraction";

export interface MaterialContext {
  text: string;
  pages: number[];
  hasText: boolean;
  fileName: string;
}

/**
 * Loads the user's material and builds a bounded context from stored chunks.
 * Ownership is enforced by both the explicit user_id filter and RLS.
 */
export async function loadMaterialContext(
  supabase: SupabaseClient,
  userId: string,
  materialId: string,
  query: string
): Promise<MaterialContext | null> {
  // Select only the columns that every schema revision is guaranteed to have,
  // then fetch the (possibly large) extracted text separately. This keeps a
  // missing/renamed extraction column from being mistaken for a missing
  // material.
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, file_name")
    .eq("id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (materialError) {
    // Never turn an infrastructure error into a misleading "material not
    // found" message. The caller falls back to its generic failure state.
    console.error("loadMaterialContext: material lookup failed", {
      materialId,
      code: materialError.code,
      message: materialError.message,
    });
    return null;
  }

  if (!material) return null;

  const { data: chunks } = await supabase
    .from("material_chunks")
    .select("page, content")
    .eq("material_id", materialId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true })
    .limit(400);

  const rows = (chunks ?? []) as Array<{ page: number | null; content: string }>;
  let text = "";
  let pages: number[] = [];

  if (rows.length > 0) {
    const context = selectContext(rows, query, 14_000);
    text = context.text;
    pages = context.pages;
  } else {
    const { data: stored } = await supabase
      .from("materials")
      .select("extracted_text")
      .eq("id", materialId)
      .eq("user_id", userId)
      .maybeSingle();
    text = ((stored?.extracted_text as string | null) ?? "").slice(0, 14_000);
  }

  return {
    text,
    pages,
    hasText: text.trim().length > 0,
    fileName: material.file_name as string,
  };
}
