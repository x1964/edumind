interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface BucketConfig {
  limit: number;
  windowMs: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const AI_RATE_LIMIT: BucketConfig = { limit: 20, windowMs: 5 * 60 * 1000 };
export const UPLOAD_RATE_LIMIT: BucketConfig = { limit: 20, windowMs: 10 * 60 * 1000 };

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
 * Shared fixed-window limiter. Production fails closed when Redis is not
 * configured rather than silently reverting to a per-instance Map.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!redisUrl || !redisToken) {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfterSeconds: 60 };
    }
    return localRateLimit(key, limit, windowMs);
  }

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
        ["EXPIRE", bucket, windowSeconds],
        ["TTL", bucket],
      ]),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("rate_limit_store_unavailable");
    const result = (await response.json()) as Array<{ result?: number }>;
    const count = Number(result[0]?.result ?? 0);
    const ttl = Math.max(1, Number(result[2]?.result ?? windowSeconds));
    return count <= limit
      ? { allowed: true, retryAfterSeconds: 0 }
      : { allowed: false, retryAfterSeconds: ttl };
  } catch {
    // A configured but unavailable limiter must fail closed in every env.
    return { allowed: false, retryAfterSeconds: 60 };
  }
}
