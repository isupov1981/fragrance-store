import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  signAdminSession,
} from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/server";
import { auditLog } from "@/lib/security/audit";
import {
  enforceRateLimit,
  rateLimitPolicies,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    auditLog({ event: "admin_login_origin_rejected", level: "warn", outcome: "blocked" });
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const limited = await enforceRateLimit(
    request,
    rateLimitPolicies.adminLogin,
    parsed.data.email,
  );
  if (!limited.ok) {
    return rateLimitResponse(limited.result, "Too many login attempts");
  }

  if (!process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Admin authentication is not configured" },
      { status: 503 },
    );
  }

  let identity: { email: string; passwordHash: string; name: string; role: "ADMIN" | "EDITOR" } | null = null;
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder")) {
    const { prisma } = await import("@/lib/db/prisma");
    identity = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email },
      select: { email: true, passwordHash: true, name: true, role: true },
    });
  } else if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    identity = {
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      name: process.env.ADMIN_NAME?.trim() || "Administrator",
      role: process.env.ADMIN_ROLE === "EDITOR" ? "EDITOR" : "ADMIN",
    };
  }

  if (
    !identity ||
    parsed.data.email !== identity.email ||
    !(await compare(parsed.data.password, identity.passwordHash))
  ) {
    auditLog({
      event: "admin_login_failed",
      level: "warn",
      outcome: "failure",
      meta: { reason: "invalid_credentials" },
    });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAdminSession({
    sub: identity.email,
    name: identity.name,
    role: identity.role,
  });
  auditLog({
    event: "admin_login_success",
    outcome: "success",
    meta: { role: identity.role },
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return response;
}
