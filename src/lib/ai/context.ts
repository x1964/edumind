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
  const { data: material } = await supabase
    .from("materials")
    .select("id, file_name, extracted_text, status")
    .eq("id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!material) return null;

  const { data: chunks } = await supabase
    .from("material_chunks")
    .select("page, content")
    .eq("material_id", materialId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true })
    .limit(400);

  const rows = (chunks ?? []) as Array<{ page: number | null; content: string }>;
  const context =
    rows.length > 0
      ? selectContext(rows, query, 14_000)
      : {
          text: (material.extracted_text ?? "").slice(0, 14_000),
          pages: [],
        };

  return {
    text: context.text,
    pages: context.pages,
    hasText: context.text.trim().length > 0,
    fileName: material.file_name as string,
  };
}
