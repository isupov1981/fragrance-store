import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const ADMIN_COOKIE = "fragrance_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type AdminRole = "ADMIN" | "EDITOR";

export interface AdminSession extends JWTPayload {
  sub: string;
  role: AdminRole;
  name: string;
}

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminSession(
  session: Pick<AdminSession, "sub" | "role" | "name">,
) {
  return new SignJWT({ role: session.role, name: session.name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(session.sub)
    .setIssuer("fragrance-store")
    .setAudience("fragrance-admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function verifyAdminSession(token?: string | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ["HS256"],
      issuer: "fragrance-store",
      audience: "fragrance-admin",
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "EDITOR")
    ) {
      return null;
    }
    return payload as AdminSession;
  } catch {
    return null;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
  priority: "high" as const,
};
