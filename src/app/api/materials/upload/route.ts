import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit, UPLOAD_RATE_LIMIT } from "@/lib/rate-limit";
import {
  EXT_BY_KIND,
  MIME_BY_KIND,
  MAX_FILE_BYTES,
  MAX_PAGES,
  kindFromName,
  sanitizeFileName,
  validateFileContent,
} from "@/lib/documents/file-validation";
import {
  MAX_EXTRACTED_CHARS,
  buildExtraction,
  chunkPages,
  normalizeText,
} from "@/lib/documents/extraction";

const pagesSchema = z
  .array(
    z.object({
      page: z.number().int().min(1).max(MAX_PAGES),
      text: z.string().max(500_000),
    })
  )
  .max(MAX_PAGES);

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limit = checkRateLimit(
    `upload:${user.id}`,
    UPLOAD_RATE_LIMIT.limit,
    UPLOAD_RATE_LIMIT.windowMs
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (file.size <= 0) return NextResponse.json({ error: "empty_file" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const kind = kindFromName(file.name);
  if (!kind) return NextResponse.json({ error: "invalid_type" }, { status: 415 });

  if (!(await validateFileContent(file, kind))) {
    return NextResponse.json({ error: "invalid_content" }, { status: 415 });
  }

  let pages: Array<{ page: number; text: string }> = [];
  const rawPages = formData.get("pages");
  if (typeof rawPages === "string" && rawPages.length > 0) {
    try {
      const parsed = pagesSchema.safeParse(JSON.parse(rawPages));
      if (parsed.success) pages = parsed.data;
    } catch {
      pages = [];
    }
  }

  const extraction = buildExtraction(
    pages.map((page) => ({ page: page.page, text: normalizeText(page.text) }))
  );
  const hasText = extraction.text.trim().length > 20;
  const chunks = hasText ? chunkPages(extraction.pages) : [];

  const supabase = await createSupabaseServerClient();
  const displayName = sanitizeFileName(file.name);
  const storagePath = `${user.id}/${crypto.randomUUID()}.${EXT_BY_KIND[kind]}`;

  const upload = await supabase.storage.from("materials").upload(storagePath, file, {
    contentType: MIME_BY_KIND[kind],
    upsert: false,
    cacheControl: "private, max-age=0",
  });

  if (upload.error) {
    return NextResponse.json({ error: "storage_failed" }, { status: 500 });
  }

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      user_id: user.id,
      file_name: displayName,
      file_type: kind,
      mime_type: MIME_BY_KIND[kind],
      file_size: file.size,
      storage_path: storagePath,
      status: hasText ? "ready" : "failed",
      error_message: hasText ? null : "no_extractable_text",
      extracted_text: hasText ? extraction.text.slice(0, MAX_EXTRACTED_CHARS) : null,
      page_count: extraction.pageCount || null,
      word_count: extraction.wordCount || null,
    })
    .select("id, status")
    .single();

  if (insertError || !material) {
    await supabase.storage.from("materials").remove([storagePath]);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  if (hasText && chunks.length > 0) {
    const rows = chunks.map((chunk) => ({
      material_id: material.id,
      user_id: user.id,
      chunk_index: chunk.index,
      page: chunk.page,
      content: chunk.content,
    }));

    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from("material_chunks").insert(rows.slice(i, i + 100));
      if (error) {
        await supabase.from("materials").delete().eq("id", material.id).eq("user_id", user.id);
        await supabase.storage.from("materials").remove([storagePath]);
        return NextResponse.json({ error: "processing_failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    id: material.id,
    status: material.status,
    hasText,
    wordCount: extraction.wordCount,
  });
}
