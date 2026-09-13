import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  signAdminSession,
} from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/server";

const credentialsSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(256),
});

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAdminSession({
    sub: identity.email,
    name: identity.name,
    role: identity.role,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
  return response;
}
