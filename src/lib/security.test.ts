import { describe, expect, it } from "vitest";
import { isValidPushEndpoint } from "@/lib/push/server";
import { validateFileContent } from "@/lib/documents/file-validation";
import { checkRateLimit } from "@/lib/rate-limit";

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

  it("fails closed in production when distributed rate limiting is not configured", async () => {
    const env = process.env as Record<string, string | undefined>;
    const previousNodeEnv = process.env.NODE_ENV;
    const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
    const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    env.NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const result = await checkRateLimit("security-test", 10, 60_000);
    expect(result.allowed).toBe(false);
    env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  });
});
