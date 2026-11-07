import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/rate-limit";

const BUCKET = "student-feed-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const postIdSchema = z.string().uuid();
const commentSchema = z.object({
  postId: postIdSchema,
  content: z.string().trim().min(1).max(1000),
});
const reportSchema = z.object({
  postId: postIdSchema,
  reason: z.enum(["spam", "harassment", "inappropriate", "misinformation", "other"]),
});
const deleteSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("post"), id: postIdSchema }),
  z.object({ kind: z.literal("comment"), id: postIdSchema }),
]);

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

async function limited(userId: string, scope: string, limit: number, windowMs: number) {
  const result = await checkRateLimit(`student-feed:${scope}:${userId}`, limit, windowMs);
  return result.allowed
    ? null
    : NextResponse.json(
        { error: "rate_limited", retryAfter: result.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
      );
}

async function identifyImage(
  file: File
): Promise<"image/jpeg" | "image/png" | "image/webp" | null> {
  if (!file.size || file.size > MAX_IMAGE_BYTES) return null;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    file.type === "image/png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (
    file.type === "image/webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

function imageUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  path: string | null
) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return fail("not_configured", 503);
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  const supabase = await createSupabaseServerClient();
  const url = new URL(request.url);
  const commentsFor = url.searchParams.get("comments");

  if (commentsFor !== null) {
    const parsedId = postIdSchema.safeParse(commentsFor);
    if (!parsedId.success) return fail("invalid_input");
    const { data, error, count } = await supabase
      .from("student_post_comments")
      .select("id, post_id, user_id, author_name, author_avatar_url, content, created_at", {
        count: "exact",
      })
      .eq("post_id", parsedId.data)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return fail("load_failed", 500);
    return NextResponse.json({ comments: (data ?? []).reverse(), count: count ?? 0 });
  }

  const before = url.searchParams.get("before");
  const beforeId = url.searchParams.get("beforeId");
  let cursorTime: string | null = null;
  let cursorId: string | null = null;
  if (before || beforeId) {
    const parsedTime = before ? z.string().datetime({ offset: true }).safeParse(before) : null;
    const parsedId = beforeId ? postIdSchema.safeParse(beforeId) : null;
    if (!parsedTime?.success || !parsedId?.success) return fail("invalid_cursor");
    cursorTime = parsedTime.data;
    cursorId = parsedId.data;
  }

  const { data, error } = await supabase.rpc("get_student_feed", {
    p_before_created_at: cursorTime,
    p_before_id: cursorId,
    p_limit: 20,
  });
  if (error) return fail("load_failed", 500);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const posts = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    content: row.content,
    imageUrl: imageUrl(supabase, typeof row.image_path === "string" ? row.image_path : null),
    createdAt: row.created_at,
    likesCount: Number(row.likes_count ?? 0),
    commentsCount: Number(row.comments_count ?? 0),
    likedByMe: Boolean(row.liked_by_me),
  }));
  const last = rows[rows.length - 1];
  return NextResponse.json({
    posts,
    hasMore: rows.length === 20,
    nextCursor: last ? { before: last.created_at, beforeId: last.id } : null,
  });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("origin_not_allowed", 403);
  if (!isSupabaseConfigured()) return fail("not_configured", 503);
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  const supabase = await createSupabaseServerClient();
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const rateLimit = await limited(user.id, "post", 5, 10 * 60 * 1000);
    if (rateLimit) return rateLimit;
    const declaredSize = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES + 16_384)
      return fail("image_too_large", 413);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("invalid_form");
    }
    const contentResult = z.string().trim().min(1).max(3000).safeParse(form.get("content"));
    if (!contentResult.success) return fail("invalid_content");

    const entry = form.get("image");
    let imagePath: string | null = null;
    if (entry !== null && (!(entry instanceof File) || entry.size > 0)) {
      if (!(entry instanceof File)) return fail("invalid_image");
      const mime = await identifyImage(entry);
      if (!mime)
        return fail(
          entry.size > MAX_IMAGE_BYTES ? "image_too_large" : "invalid_image",
          entry.size > MAX_IMAGE_BYTES ? 413 : 415
        );
      const extension = mime === "image/jpeg" ? "jpg" : mime.slice(6);
      imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage
        .from(BUCKET)
        .upload(imagePath, entry, { contentType: mime, upsert: false, cacheControl: "3600" });
      if (upload.error) return fail("image_upload_failed", 500);
    }

    const { data, error } = await supabase
      .from("student_posts")
      .insert({ user_id: user.id, content: contentResult.data, image_path: imagePath })
      .select("id, user_id, author_name, author_avatar_url, content, image_path, created_at")
      .single();
    if (error || !data) {
      if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
      return fail("publish_failed", 500);
    }
    return NextResponse.json(
      {
        post: {
          id: data.id,
          userId: data.user_id,
          authorName: data.author_name,
          authorAvatarUrl: data.author_avatar_url,
          content: data.content,
          imageUrl: imageUrl(supabase, data.image_path),
          createdAt: data.created_at,
          likesCount: 0,
          commentsCount: 0,
          likedByMe: false,
        },
      },
      { status: 201 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_input");
  }
  const action = z.object({ action: z.enum(["like", "comment", "report"]) }).safeParse(body);
  if (!action.success) return fail("invalid_input");

  if (action.data.action === "like") {
    const parsed = z.object({ postId: postIdSchema }).safeParse(body);
    if (!parsed.success) return fail("invalid_input");
    const rateLimit = await limited(user.id, "like", 60, 60_000);
    if (rateLimit) return rateLimit;
    const { data, error } = await supabase.rpc("toggle_student_post_like", {
      p_post_id: parsed.data.postId,
    });
    if (error)
      return fail(
        error.message.includes("post_not_found") ? "post_not_found" : "like_failed",
        error.message.includes("post_not_found") ? 404 : 500
      );
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      liked: Boolean(result?.liked),
      likesCount: Number(result?.likes_count ?? 0),
    });
  }

  if (action.data.action === "comment") {
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return fail("invalid_input");
    const rateLimit = await limited(user.id, "comment", 20, 10 * 60 * 1000);
    if (rateLimit) return rateLimit;
    const { data, error } = await supabase
      .from("student_post_comments")
      .insert({ post_id: parsed.data.postId, user_id: user.id, content: parsed.data.content })
      .select("id, post_id, user_id, author_name, author_avatar_url, content, created_at")
      .single();
    if (error || !data) return fail("comment_failed", 500);
    const { count } = await supabase
      .from("student_post_comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", parsed.data.postId);
    return NextResponse.json({ comment: data, count: count ?? 0 }, { status: 201 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return fail("invalid_input");
  const rateLimit = await limited(user.id, "report", 5, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;
  const { error } = await supabase.from("student_post_reports").insert({
    post_id: parsed.data.postId,
    reporter_id: user.id,
    reason: parsed.data.reason,
  });
  if (error?.code === "23505") return fail("already_reported", 409);
  if (error) return fail("report_failed", 500);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return fail("origin_not_allowed", 403);
  if (!isSupabaseConfigured()) return fail("not_configured", 503);
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  const rateLimit = await limited(user.id, "delete", 15, 10 * 60 * 1000);
  if (rateLimit) return rateLimit;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_input");
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return fail("invalid_input");
  const supabase = await createSupabaseServerClient();

  if (parsed.data.kind === "comment") {
    const { data, error } = await supabase
      .from("student_post_comments")
      .delete()
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) return fail("delete_failed", 500);
    if (!data) return fail("not_found_or_forbidden", 404);
    return NextResponse.json({ ok: true });
  }

  const { data: post, error: readError } = await supabase
    .from("student_posts")
    .select("id, image_path")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) return fail("delete_failed", 500);
  if (!post) return fail("not_found_or_forbidden", 404);
  const { data: deleted, error } = await supabase
    .from("student_posts")
    .delete()
    .eq("id", post.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !deleted) return fail("delete_failed", 500);
  let imageCleanup = true;
  if (post.image_path && post.image_path.startsWith(`${user.id}/`)) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([post.image_path]);
    imageCleanup = !storageError;
  }
  return NextResponse.json({ ok: true, imageCleanup });
}
