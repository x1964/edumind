import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  isVoiceConfigured,
  synthesizeSpeech,
  VoiceNotConfiguredError,
  VoiceProviderError,
  VoiceUnsupportedError,
} from "@/lib/ai/voice";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  lang: z.enum(["ar", "en"]).default("ar"),
  speed: z.coerce.number().min(0.5).max(2).default(1),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!isVoiceConfigured()) {
    return Response.json({ error: "voice_not_configured" }, { status: 503 });
  }

  // Speech is an expensive provider call: limit per user rather than globally.
  const limit = await checkRateLimit(`voice:${user.id}`, 12, 5 * 60 * 1000);
  if (!limit.allowed) {
    return Response.json(
      { error: "rate_limited", retryAfter: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: "invalid_body" }, { status: 400 });

  try {
    const result = await synthesizeSpeech(parsed.data);
    return new Response(result.audio, {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(result.audio.byteLength),
        "X-Voice-Provider": "openai_compatible",
      },
    });
  } catch (error) {
    if (error instanceof VoiceNotConfiguredError) {
      return Response.json({ error: "voice_not_configured" }, { status: 503 });
    }
    if (error instanceof VoiceUnsupportedError) {
      return Response.json({ error: "language_unsupported" }, { status: 422 });
    }
    if (error instanceof VoiceProviderError) {
      return Response.json(
        { error: error.status === 429 ? "rate_limited" : "voice_failed" },
        { status: error.status >= 400 ? error.status : 502 }
      );
    }
    return Response.json({ error: "voice_failed" }, { status: 502 });
  }
}
