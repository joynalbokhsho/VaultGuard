/**
 * IN-MEMORY RATE LIMITER
 * ========================
 * Lightweight rate limiting without external dependencies.
 * For production, swap to Upstash Redis for distributed rate limiting.
 *
 * Usage:
 *   const limiter = getRateLimiter("login");
 *   const result = await limiter.check(req, 5, "1m"); // 5 per minute
 *   if (!result.success) return rateLimitResponse(result);
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — use Upstash Redis in production for distributed deployment
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

type Duration = "10s" | "1m" | "5m" | "15m" | "1h";

function durationToMs(duration: Duration): number {
  const map: Record<Duration, number> = {
    "10s": 10_000,
    "1m": 60_000,
    "5m": 300_000,
    "15m": 900_000,
    "1h": 3_600_000,
  };
  return map[duration];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp ms
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (IP + route)
 * @param maxRequests - Maximum requests allowed
 * @param duration - Time window
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  duration: Duration
): RateLimitResult {
  const now = Date.now();
  const windowMs = durationToMs(duration);
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: now + windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { success: false, limit: maxRequests, remaining: 0, reset: entry.resetAt };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Get client IP from Next.js request.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

/**
 * Apply rate limiting to an API route.
 * Returns a 429 response if limit exceeded, null if OK.
 */
export function applyRateLimit(
  req: NextRequest,
  route: string,
  maxRequests: number,
  duration: Duration
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${route}:${ip}`;
  const result = checkRateLimit(key, maxRequests, duration);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Rate limit presets for different route types.
 */
export const RateLimits = {
  /** Strict: login, register — 5 attempts per minute */
  auth: (req: NextRequest) => applyRateLimit(req, "auth", 5, "1m"),
  /** Medium: vault operations — 30 per minute */
  vault: (req: NextRequest) => applyRateLimit(req, "vault", 30, "1m"),
  /** Loose: read operations — 60 per minute */
  read: (req: NextRequest) => applyRateLimit(req, "read", 60, "1m"),
  /** Very strict: 2FA — 3 per 15 minutes */
  twoFactor: (req: NextRequest) => applyRateLimit(req, "2fa", 3, "15m"),
};
