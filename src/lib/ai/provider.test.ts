import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

interface FetchCall {
  url: string;
  body: Record<string, unknown>;
}

interface FetchResponseSpec {
  status?: number;
  content?: string;
}

function stubFetch(handler: (callIndex: number) => FetchResponseSpec) {
  const calls: FetchCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    calls.push({ url: String(input), body });
    const spec = handler(calls.length - 1);
    const status = spec.status ?? 200;
    const ok = status >= 200 && status < 300;
    return {
      ok,
      status,
      json: async () => ({ choices: [{ message: { content: spec.content ?? "" } }] }),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

describe("AI provider structured generation", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AI_PROVIDER = "google";
    process.env.AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
    process.env.AI_API_KEY = "test-api-key";
    process.env.AI_MODEL = "test-model-primary";
    process.env.AI_MODEL_FALLBACKS = "test-model-fallback";
    process.env.AI_MAX_OUTPUT_TOKENS = "1024";
    process.env.AI_TIMEOUT_MS = "5000";
    process.env.AI_JSON_MODE = "false";
    vi.unstubAllGlobals();
  });

  async function loadProvider() {
    return await import("./provider");
  }

  it("parses a plain JSON response into the expected schema without response_format", async () => {
    const { generateStructured } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    const { fetchMock, calls } = stubFetch(() => ({
      content: '{"title":"عملية البناء الضوئي"}',
    }));

    const result = await generateStructured(schema, { system: "sys", prompt: "prompt" });

    expect(result).toEqual({ title: "عملية البناء الضوئي" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls[0].body.model).toBe("test-model-primary");
    expect(calls[0].body).not.toHaveProperty("response_format");
  });

  it("unwraps fenced JSON content before parsing", async () => {
    const { generateStructured } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    const stub = stubFetch(() => ({
      content: '```json\n{"title":"ملخص مختصر"}\n```',
    }));

    const result = await generateStructured(schema, { system: "sys", prompt: "prompt" });

    expect(result).toEqual({ title: "ملخص مختصر" });
    expect(stub.fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends response_format when AI_JSON_MODE is enabled", async () => {
    process.env.AI_JSON_MODE = "true";
    const { generateStructured } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    const { calls } = stubFetch(() => ({ content: '{"title":"ملخص"}' }));

    const result = await generateStructured(schema, { system: "sys", prompt: "prompt" });
    expect(result).toEqual({ title: "ملخص" });
    expect(calls[0].body.response_format).toEqual({ type: "json_object" });
  });

  it("throws a provider error when the AI response is not valid JSON", async () => {
    const { generateStructured, AiProviderError } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    stubFetch(() => ({ content: "هذا الرد ليس JSON صالحًا" }));

    await expect(generateStructured(schema, { system: "sys", prompt: "prompt" })).rejects.toThrow(
      AiProviderError
    );
  });

  it("throws a provider error when the AI response does not match the schema", async () => {
    const { generateStructured, AiProviderError } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    stubFetch(() => ({ content: JSON.stringify({ wrong: true }) }));

    await expect(generateStructured(schema, { system: "sys", prompt: "prompt" })).rejects.toThrow(
      AiProviderError
    );
  });

  it("falls back to the next model when the primary model is rate limited", async () => {
    const { generateStructured } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    const { fetchMock, calls } = stubFetch((callIndex) =>
      callIndex === 0 ? { status: 429 } : { content: '{"title":"النتيجة من المزوّد البديل"}' }
    );

    const result = await generateStructured(schema, { system: "sys", prompt: "prompt" });

    expect(result).toEqual({ title: "النتيجة من المزوّد البديل" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(calls[1].body.model).toBe("test-model-fallback");
  });

  it("does not call a fallback model when the primary model succeeds", async () => {
    const { generateStructured } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    const { fetchMock } = stubFetch(() => ({ content: '{"title":"النتيجة"}' }));

    const result = await generateStructured(schema, { system: "sys", prompt: "prompt" });
    expect(result).toEqual({ title: "النتيجة" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when every configured model fails with 503", async () => {
    const { generateStructured, AiProviderError } = await loadProvider();
    const schema = z.object({ title: z.string().min(2).max(160) });
    stubFetch(() => ({ status: 503 }));

    await expect(generateStructured(schema, { system: "sys", prompt: "prompt" })).rejects.toThrow(
      AiProviderError
    );
  });
});
