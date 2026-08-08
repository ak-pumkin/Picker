/**
 * Rate limiting for the API routes.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set, this uses a
 * real distributed sliding-window limiter (safe across multiple serverless
 * instances, which is what you want in production on Vercel).
 *
 * Without those env vars, it falls back to a simple in-memory limiter. That
 * fallback is fine for local dev and single-instance deployments, but does
 * NOT share state across serverless function instances — don't rely on it
 * for a real multi-instance production deployment. A console warning fires
 * once to make that obvious.
 */

type LimitResult = { success: boolean; remaining: number; limit: number };

const WINDOW_MS = 60_000; // 1 minute
const DEFAULT_LIMIT = 60; // 60 requests/minute/identity for normal routes
const WRITE_LIMIT = 20; // stricter limit for writes (POST/PUT/DELETE)

let warnedAboutMemoryFallback = false;

// ── In-memory fallback ───────────────────────────────────────────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number): LimitResult {
  if (!warnedAboutMemoryFallback) {
    warnedAboutMemoryFallback = true;
    console.warn(
      "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — using an in-memory " +
        "rate limiter. This does not share state across serverless instances. " +
        "Fine for local dev; set up Upstash before relying on this in production."
    );
  }
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: limit - 1, limit };
  }
  entry.count += 1;
  const success = entry.count <= limit;
  return { success, remaining: Math.max(0, limit - entry.count), limit };
}

// ── Upstash-backed limiter (lazy-loaded so the deps are optional) ───────
let upstashLimiterPromise: Promise<any> | null = null;

async function getUpstashLimiters() {
  if (!upstashLimiterPromise) {
    upstashLimiterPromise = (async () => {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      return {
        standard: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(DEFAULT_LIMIT, "60 s"),
          prefix: "picker:rl:std",
        }),
        write: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(WRITE_LIMIT, "60 s"),
          prefix: "picker:rl:write",
        }),
      };
    })();
  }
  return upstashLimiterPromise;
}

function hasUpstash() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Checks whether `identifier` (usually the signed-in user's id, falling back
 * to their IP) is within the rate limit for this kind of request.
 */
export async function checkRateLimit(
  identifier: string,
  kind: "standard" | "write" = "standard"
): Promise<LimitResult> {
  const limit = kind === "write" ? WRITE_LIMIT : DEFAULT_LIMIT;

  if (hasUpstash()) {
    try {
      const limiters = await getUpstashLimiters();
      const { success, remaining, limit: upstashLimit } = await limiters[kind].limit(identifier);
      return { success, remaining, limit: upstashLimit };
    } catch (err) {
      console.error("[rateLimit] Upstash call failed, falling back to in-memory:", err);
      return memoryRateLimit(`${kind}:${identifier}`, limit);
    }
  }

  return memoryRateLimit(`${kind}:${identifier}`, limit);
}

/** Standard 429 response with the usual rate-limit headers. */
export function rateLimitResponse(result: LimitResult) {
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
    },
  });
}

/** Prefers the signed-in user's id; falls back to their IP for anonymous routes. */
export function getClientIdentifier(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}
