import { isSupabaseConfigured } from "@/lib/supabase/config";

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface BucketConfig {
  limit: number;
  windowMs: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export const AI_RATE_LIMIT: BucketConfig = { limit: 20, windowMs: 5 * 60 * 1000 };
export const UPLOAD_RATE_LIMIT: BucketConfig = { limit: 20, windowMs: 10 * 60 * 1000 };

const warned = new Set<string>();

// When a configured store is down, skip it briefly so every request does not
// pay the connection timeout before falling back.
let redisDisabledUntil = 0;
let supabaseDisabledUntil = 0;

function warnOnce(scope: string, message: string, error?: unknown) {
  if (warned.has(scope)) return;
  warned.add(scope);
  // Rate limiting is a protection layer, never a reason to break the product.
  console.warn(`[rate-limit] ${message}`, error instanceof Error ? error.message : "");
}

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Upstash-compatible fixed window. EXPIRE only runs with NX so the window does
 * not slide forward on every request. Returns null when the store is
 * unavailable so the caller can fall back instead of rejecting valid users.
 */
async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return null;
  if (Date.now() < redisDisabledUntil) return null;

  const bucket = `edumind:rate:${key}`;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", bucket],
        ["EXPIRE", bucket, windowSeconds, "NX"],
        ["TTL", bucket],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) throw new Error("rate_limit_store_unavailable");
    redisDisabledUntil = 0;
    const result = (await response.json()) as Array<{ result?: number }>;
    const count = Number(result[0]?.result ?? 0);
    const ttl = Math.max(1, Number(result[2]?.result ?? windowSeconds));
    return count <= limit
      ? { allowed: true, retryAfterSeconds: 0 }
      : { allowed: false, retryAfterSeconds: ttl };
  } catch (error) {
    redisDisabledUntil = Date.now() + 60_000;
    warnOnce("redis", "Redis rate limit store unavailable; using fallback.", error);
    return null;
  }
}

interface RateLimitRow {
  allowed?: boolean;
  retry_after_seconds?: number;
}

/**
 * Distributed fallback that uses the Supabase project the app already needs.
 * The RPC lives in `supabase/migrations/20261107010000_rate_limit.sql`.
 * Returns null when the RPC has not been applied or the call fails.
 */
async function supabaseRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  if (!isSupabaseConfigured()) return null;
  if (Date.now() < supabaseDisabledUntil) return null;
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
      p_bucket: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
    if (!row || typeof row.allowed !== "boolean") throw new Error("unexpected_rate_limit_result");
    supabaseDisabledUntil = 0;
    return {
      allowed: row.allowed,
      retryAfterSeconds: Math.max(0, Number(row.retry_after_seconds ?? 0)),
    };
  } catch (error) {
    supabaseDisabledUntil = Date.now() + 5 * 60_000;
    warnOnce(
      "supabase",
      "Supabase rate limit function unavailable; using in-memory fallback.",
      error
    );
    return null;
  }
}

/**
 * Shared fixed-window limiter.
 *
 * Order of preference:
 *   1. Upstash Redis (when configured) — global across all instances.
 *   2. Supabase RPC (when the migration is applied) — global across instances.
 *   3. In-process memory — bounded protection per instance.
 *
 * A missing or unreachable store never blocks legitimate users. Previously
 * production failed closed without Redis, which made every upload and AI
 * request answer "too many requests" on deployments without Upstash.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const distributed = await redisRateLimit(key, limit, windowMs);
  if (distributed) return distributed;

  const fallback = await supabaseRateLimit(key, limit, windowMs);
  if (fallback) return fallback;

  return localRateLimit(key, limit, windowMs);
}

/** Test helper: clears the in-process buckets. */
export function resetLocalRateLimits() {
  buckets.clear();
}
