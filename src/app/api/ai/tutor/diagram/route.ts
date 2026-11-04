import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAiConfigured, complete } from "@/lib/ai/provider";
import { tutorDiagramSystemPrompt } from "@/lib/ai/prompts";
import { loadMaterialContext } from "@/lib/ai/context";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";

const bodySchema = z.object({
  threadId: z.string().uuid(),
  question: z.string().min(1).max(12_000),
  lang: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (!isAiConfigured()) {
    return Response.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const limit = checkRateLimit(
    `tutor:diagram:${user.id}`,
    AI_RATE_LIMIT.limit,
    AI_RATE_LIMIT.windowMs
  );
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

  const { threadId, question, lang } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: thread } = await supabase
    .from("tutor_threads")
    .select("id, user_id, material_id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!thread) return Response.json({ error: "not_found" }, { status: 404 });

  const materialContext = thread.material_id
    ? await loadMaterialContext(supabase, user.id, thread.material_id as string, question)
    : null;

  const diagram = (
    await complete({
      messages: [
        { role: "system", content: tutorDiagramSystemPrompt(lang, materialContext?.text ?? null) },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      maxTokens: 1200,
    })
  )
    .replace(/```(?:mermaid)?[\s\S]*?```/gi, "")
    .trim();

  if (!diagram) return Response.json({ error: "empty_response" }, { status: 502 });

  return Response.json({ mermaid: diagram });
}
