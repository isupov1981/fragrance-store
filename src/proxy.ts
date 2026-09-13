import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/session";

const publicPaths = new Set([
  "/admin/login",
  "/api/admin/auth/login",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifyAdminSession(
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (publicPaths.has(pathname)) {
    if (pathname === "/admin/login" && session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
