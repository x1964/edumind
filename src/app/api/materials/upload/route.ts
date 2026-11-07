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
import { extractDocumentOnServer, MAX_GENERATED_CHUNKS } from "@/lib/documents/server-extract";

export const maxDuration = 60;

const pagesSchema = z
  .array(
    z.object({
      page: z.number().int().min(1).max(MAX_PAGES),
      text: z.string().max(MAX_EXTRACTED_CHARS),
    })
  )
  .max(MAX_PAGES);

/**
 * The browser extracts the document for the preview. That work is reused here
 * so a slow or unavailable server-side parser can never fail an upload, but
 * only after the real file has passed signature, size, and type validation and
 * the page payload is bounded. Server extraction remains the fallback when the
 * client does not send pages.
 */
function parseClientPages(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length === 0) return null;
  if (value.length > MAX_EXTRACTED_CHARS * 2) return null;
  try {
    const parsed = pagesSchema.safeParse(JSON.parse(value));
    if (!parsed.success) return null;
    const pages = parsed.data
      .map((page) => ({ page: page.page, text: normalizeText(page.text) }))
      .filter((page) => page.text.length > 0);
    return pages.length > 0 ? pages : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_BYTES + 2_097_152) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const limit = await checkRateLimit(
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

  const clientPages = parseClientPages(formData.get("pages"));
  let extraction;
  if (clientPages) {
    extraction = buildExtraction(clientPages);
  } else {
    try {
      extraction = await extractDocumentOnServer(file, kind);
    } catch (error) {
      console.error(
        "[materials/upload] server extraction failed",
        error instanceof Error ? error.message : error
      );
      const code =
        error instanceof Error && error.message === "too_many_pages"
          ? "too_many_pages"
          : "extraction_failed";
      return NextResponse.json({ error: code }, { status: 422 });
    }
  }
  const hasText = extraction.text.trim().length > 20;
  const chunks = hasText ? chunkPages(extraction.pages) : [];
  if (chunks.length > MAX_GENERATED_CHUNKS) {
    return NextResponse.json({ error: "extraction_too_large" }, { status: 422 });
  }

  const supabase = await createSupabaseServerClient();
  const displayName = sanitizeFileName(file.name);
  const storagePath = `${user.id}/${crypto.randomUUID()}.${EXT_BY_KIND[kind]}`;

  const upload = await supabase.storage.from("materials").upload(storagePath, file, {
    contentType: MIME_BY_KIND[kind],
    upsert: false,
    cacheControl: "private, max-age=0",
  });

  if (upload.error) {
    console.error("[materials/upload] storage upload failed", upload.error.message);
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
    console.error("[materials/upload] insert failed", insertError?.message);
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
        console.error("[materials/upload] chunk insert failed", error.message);
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
