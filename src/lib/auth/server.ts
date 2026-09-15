import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "./session";

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1);
  return verifyAdminSession(token);
}

function originsMatch(a: string, b: string) {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

/** Public origins allowed for browser POSTs (admin CSRF check). */
function allowedOrigins(request: Request): string[] {
  const origins = [new URL(request.url).origin];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) origins.push(siteUrl);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (new URL(request.url).protocol === "https:" ? "https" : "http");
    origins.push(`${proto}://${host}`);
  }

  return origins;
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return allowedOrigins(request).some((allowed) => originsMatch(origin, allowed));
}
