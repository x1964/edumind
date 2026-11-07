import { describe, expect, it } from "vitest";
import { isValidPushEndpoint } from "@/lib/push/server";
import { validateFileContent } from "@/lib/documents/file-validation";
import { checkRateLimit, resetLocalRateLimits } from "@/lib/rate-limit";

describe("security validation", () => {
  it("accepts supported HTTPS browser push providers", () => {
    expect(isValidPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isValidPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(
      true
    );
    expect(isValidPushEndpoint("https://wns2.notify.windows.com/w/?abc")).toBe(true);
  });

  it("rejects insecure, local, and arbitrary push endpoints", () => {
    expect(isValidPushEndpoint("http://fcm.googleapis.com/send")).toBe(false);
    expect(isValidPushEndpoint("https://127.0.0.1/internal")).toBe(false);
    expect(isValidPushEndpoint("https://localhost:8080/internal")).toBe(false);
    expect(isValidPushEndpoint("https://example.com/callback")).toBe(false);
  });

  it("does not trust a filename or MIME type without a valid signature", async () => {
    const fakePdf = new File(["not a pdf"], "notes.pdf", { type: "application/pdf" });
    const validPdf = new File(["%PDF-1.7\n"], "notes.pdf", { type: "application/pdf" });
    expect(await validateFileContent(fakePdf, "pdf")).toBe(false);
    expect(await validateFileContent(validPdf, "pdf")).toBe(true);
  });

  it("keeps serving requests when no distributed rate limiting store is configured", async () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = process.env.NODE_ENV;
    const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
    const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    env.NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const result = await checkRateLimit(`security-test:${crypto.randomUUID()}`, 10, 60_000);
    expect(result.allowed).toBe(true);
    env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  });

  it("still enforces the bounded in-memory fallback for bursts", async () => {
    resetLocalRateLimits();
    const key = `security-test:${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i += 1) {
      expect((await checkRateLimit(key, 3, 60_000)).allowed).toBe(true);
    }
    const blocked = await checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
