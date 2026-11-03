import "server-only";
import type { ZodType } from "zod";

/**
 * Minimal provider adapter for any OpenAI-compatible Chat Completions API.
 * Swapping provider (OpenAI, OpenRouter, Groq, local Ollama, ...) is only an
 * environment-variable change. No provider SDK is bundled and no API key ever
 * reaches the browser.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI provider is not configured.");
    this.name = "AiNotConfiguredError";
  }
}

export class AiProviderError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
  }
}

const BASE_URL = (process.env.AI_BASE_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.AI_API_KEY ?? "";
const MODELS = [process.env.AI_MODEL ?? "", ...(process.env.AI_MODEL_FALLBACKS ?? "").split(",")]
  .map((model) => model.trim())
  .filter(Boolean);
const MAX_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? "2048");
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? "90000");

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export function isAiConfigured(): boolean {
  return Boolean(BASE_URL && MODELS.length > 0 && API_KEY);
}

function assertConfigured() {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
}

interface CompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
}

async function request(options: CompletionOptions, stream: boolean): Promise<Response> {
  assertConfigured();

  let lastError: AiProviderError | null = null;

  for (const [index, model] of MODELS.entries()) {
    const isLastModel = index === MODELS.length - 1;

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? MAX_TOKENS,
          stream,
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: options.signal ?? AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      // The caller cancelled the request: do not burn another model attempt.
      if (options.signal?.aborted) throw error;
      lastError = new AiProviderError("The AI provider could not be reached.", 503);
      if (isLastModel) throw lastError;
      continue;
    }

    if (response.ok) return response;

    // Do not log prompt or document content.
    const providerError = new AiProviderError(
      `The AI provider returned status ${response.status}.`,
      response.status
    );

    if (RETRYABLE_STATUS.has(response.status) && !isLastModel) {
      lastError = providerError;
      continue;
    }

    throw providerError;
  }

  throw lastError ?? new AiProviderError("No AI model is configured.", 500);
}

export async function complete(options: CompletionOptions): Promise<string> {
  const response = await request(options, false);
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AiProviderError("The AI provider returned an empty response.");
  return content;
}

export async function* streamChat(options: CompletionOptions): AsyncGenerator<string> {
  const response = await request(options, true);
  if (!response.body) throw new AiProviderError("The AI provider returned no stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore malformed keep-alive chunks.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return candidate;
  return candidate.slice(start, end + 1);
}

export async function generateStructured<T>(
  schema: ZodType<T>,
  options: { system: string; prompt: string; maxTokens?: number }
): Promise<T> {
  const raw = await complete({
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.prompt },
    ],
    temperature: 0.25,
    maxTokens: options.maxTokens,
    json: true,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new AiProviderError("The AI response was not valid JSON.");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new AiProviderError("The AI response did not match the expected structure.");
  }
  return result.data;
}
