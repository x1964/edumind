import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAiConfigured, streamChat, type ChatMessage } from "@/lib/ai/provider";
import { tutorSystemPrompt } from "@/lib/ai/prompts";
import { loadMaterialContext } from "@/lib/ai/context";
import { checkRateLimit, AI_RATE_LIMIT } from "@/lib/rate-limit";
import type { Lang } from "@/lib/i18n";

const bodySchema = z.object({
  threadId: z.string().uuid(),
  materialId: z.string().uuid().nullable().optional(),
  lang: z.enum(["ar", "en"]).default("ar"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        parts: z
          .array(
            z.object({
              type: z.string(),
              text: z.string().max(20_000).optional(),
            })
          )
          .max(20),
      })
    )
    .max(100),
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

  const limit = await checkRateLimit(
    `tutor:${user.id}`,
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

  const { threadId, lang } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: thread } = await supabase
    .from("tutor_threads")
    .select("id, user_id, material_id, title")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!thread) return Response.json({ error: "not_found" }, { status: 404 });

  const lastUser = [...parsed.data.messages].reverse().find((message) => message.role === "user");
  const question = (lastUser?.parts ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim()
    .slice(0, 12_000);

  if (!question) return Response.json({ error: "empty_message" }, { status: 400 });

  const { data: historyRows } = await supabase
    .from("tutor_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(30);

  const history: ChatMessage[] = ((historyRows ?? []) as Array<{ role: string; content: string }>)
    .filter((row) => row.role === "user" || row.role === "assistant")
    .slice(-16)
    .map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));

  let documentContext: string | null = null;
  let citationPages: number[] = [];
  if (thread.material_id) {
    const context = await loadMaterialContext(
      supabase,
      user.id,
      thread.material_id as string,
      question
    );
    if (context?.hasText) {
      documentContext = context.text;
      citationPages = context.pages;
    }
  }

  const system = tutorSystemPrompt(lang as Lang, documentContext, Boolean(thread.material_id));

  await supabase.from("tutor_messages").insert({
    thread_id: threadId,
    user_id: user.id,
    role: "user",
    content: question,
  });

  if (
    !thread.title ||
    thread.title === "New conversation" ||
    thread.title === "محادثة بدون عنوان" ||
    thread.title === "Untitled conversation"
  ) {
    await supabase
      .from("tutor_threads")
      .update({ title: question.slice(0, 70) })
      .eq("id", threadId)
      .eq("user_id", user.id);
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = crypto.randomUUID();
      let full = "";

      if (citationPages.length > 0) {
        writer.write({
          type: "message-metadata",
          messageMetadata: { pages: citationPages },
        });
      }

      writer.write({ type: "text-start", id: textId });
      try {
        for await (const delta of streamChat({
          messages: [
            { role: "system", content: system },
            ...history,
            { role: "user", content: question },
          ],
          temperature: 0.5,
          maxTokens: 2400,
          signal: request.signal,
        })) {
          full += delta;
          writer.write({ type: "text-delta", id: textId, delta });
        }
        writer.write({ type: "text-end", id: textId });
      } catch {
        writer.write({
          type: "error",
          errorText:
            lang === "ar"
              ? "تعذّر إكمال الرد. حاول مرة أخرى."
              : "We couldn't complete that response. Please try again.",
        });
      }

      if (full.trim()) {
        await supabase.from("tutor_messages").insert({
          thread_id: threadId,
          user_id: user.id,
          role: "assistant",
          content: full,
          citations: citationPages.length > 0 ? { pages: citationPages } : null,
        });
        await supabase
          .from("tutor_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId)
          .eq("user_id", user.id);
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
