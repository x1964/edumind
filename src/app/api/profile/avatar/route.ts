import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { identifyImage, imageExtension, MAX_IMAGE_BYTES } from "@/lib/documents/images";

const BUCKET = "avatars";
const AVATAR_RATE_LIMIT_SCOPE = "avatar";

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())[0];
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("origin_not_allowed", 403);
  if (!isSupabaseConfigured()) return fail("not_configured", 503);
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  const supabase = await createSupabaseServerClient();
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) return fail("invalid_form");

  const rateLimit = await checkRateLimit(
    `avatars:${AVATAR_RATE_LIMIT_SCOPE}:${user.id}`,
    5,
    10 * 60 * 1000
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("invalid_form");
  }
  const entry = form.get("file");
  if (!(entry instanceof File) || entry.size === 0) return fail("invalid_image");
  if (entry.size > MAX_IMAGE_BYTES) return fail("image_too_large", 413);
  const mime = await identifyImage(entry);
  if (!mime) return fail("invalid_image", 415);

  const extension = imageExtension(mime);
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage.from(BUCKET).upload(path, entry, {
    contentType: mime,
    upsert: false,
    cacheControl: "3600",
  });
  if (upload.error) return fail("image_upload_failed", 500);

  const { data: publicData } = await supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ avatarUrl: publicData?.publicUrl ?? null }, { status: 201 });
}
