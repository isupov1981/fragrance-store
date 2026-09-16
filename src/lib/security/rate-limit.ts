import { NextResponse } from "next/server";

import { databaseEnabled } from "@/lib/db/enabled";
import { auditLog } from "@/lib/security/audit";

export type RateLimitConfig = {
  /** Logical bucket name, e.g. admin-login */
  name: string;
  /** Max requests in the window */
  limit: number;
  /** Window length in milliseconds */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

type MemoryBucket = { count: number; resetAt: number };

const memory = new Map<string, MemoryBucket>();

/** Test helper — clears in-memory buckets between unit tests. */
export function resetRateLimitMemory() {
  memory.clear();
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function consumeRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = Date.now();
  if (databaseEnabled()) {
    try {
      return await consumeDatabase(key, config, now);
    } catch {
      // Fall through to memory if DB is briefly unavailable.
    }
  }
  return consumeMemory(`${config.name}:${key}`, config, now);
}

function consumeMemory(bucketKey: string, config: RateLimitConfig, now: number): RateLimitResult {
  const existing = memory.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    memory.set(bucketKey, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
      retryAfterSec: Math.ceil(config.windowMs / 1000),
    };
  }
  existing.count += 1;
  memory.set(bucketKey, existing);
  const allowed = existing.count <= config.limit;
  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

async function consumeDatabase(
  key: string,
  config: RateLimitConfig,
  now: number,
): Promise<RateLimitResult> {
  const { prisma } = await import("@/lib/db/prisma");
  const bucketKey = `${config.name}:${key}`;
  const resetAt = new Date(now + config.windowMs);

  const existing = await prisma.rateLimitBucket.findUnique({ where: { key: bucketKey } });
  if (!existing || existing.resetAt.getTime() <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { key: bucketKey },
      create: { key: bucketKey, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: resetAt.getTime(),
      retryAfterSec: Math.ceil(config.windowMs / 1000),
    };
  }

  const updated = await prisma.rateLimitBucket.update({
    where: { key: bucketKey },
    data: { count: { increment: 1 } },
  });
  const allowed = updated.count <= config.limit;
  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - updated.count),
    resetAt: existing.resetAt.getTime(),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt.getTime() - now) / 1000)),
  };
}

export const rateLimitPolicies = {
  adminLogin: { name: "admin-login", limit: 8, windowMs: 15 * 60 * 1000 },
  contact: { name: "contact", limit: 8, windowMs: 60 * 60 * 1000 },
  newsletter: { name: "newsletter", limit: 12, windowMs: 60 * 60 * 1000 },
  checkout: { name: "checkout", limit: 20, windowMs: 15 * 60 * 1000 },
  orderLookup: { name: "order-lookup", limit: 20, windowMs: 15 * 60 * 1000 },
  agent: { name: "agent", limit: 120, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export function rateLimitResponse(result: RateLimitResult, message = "Too many requests") {
  auditLog({
    event: "rate_limit_exceeded",
    level: "warn",
    outcome: "blocked",
    meta: { limit: result.limit, retryAfterSec: result.retryAfterSec },
  });
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "Retry-After": String(result.retryAfterSec),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig,
  identity?: string,
) {
  const key = identity ? `${clientIp(request)}:${identity}` : clientIp(request);
  const result = await consumeRateLimit(key, config);
  if (!result.allowed) return { ok: false as const, result };
  return { ok: true as const, result };
}
