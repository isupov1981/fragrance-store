import { NextRequest, NextResponse } from "next/server";
import { ADMIN_LOCALE_COOKIE, defaultAdminLocale, isAdminLocale } from "@/lib/admin/locale";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/session";
import { LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from "@/lib/i18n/config";
import {
  buildContentSecurityPolicy,
  buildHstsHeader,
  cspHeaderName,
} from "@/lib/security/headers";

const publicAdminPaths = new Set([
  "/admin/login",
  "/api/admin/auth/login",
  "/api/admin/health",
]);

function pathnameLocale(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : null;
}

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function withSecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set(cspHeaderName(), buildContentSecurityPolicy(nonce));
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", buildHstsHeader());
  }
  return response;
}

function nextWithNonce(request: NextRequest, nonce: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    nonce,
  );
}

function withLocaleHeader(response: NextResponse, locale: Locale) {
  response.headers.set("x-locale", locale);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

async function handleAdmin(request: NextRequest, pathname: string, nonce: string) {
  const adminLocaleCookie = request.cookies.get(ADMIN_LOCALE_COOKIE)?.value;
  const adminLocale = isAdminLocale(adminLocaleCookie) ? adminLocaleCookie : defaultAdminLocale;
  const session = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);

  if (publicAdminPaths.has(pathname)) {
    if (pathname === "/admin/login" && session) {
      const redirect = NextResponse.redirect(new URL("/admin", request.url));
      redirect.headers.set("x-locale", adminLocale);
      return withSecurityHeaders(redirect, nonce);
    }
    const response = nextWithNonce(request, nonce);
    response.headers.set("x-locale", adminLocale);
    return response;
  }

  if (!session) {
    if (pathname.startsWith("/api/admin")) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        nonce,
      );
    }
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(login);
    redirect.headers.set("x-locale", adminLocale);
    return withSecurityHeaders(redirect, nonce);
  }

  const response = nextWithNonce(request, nonce);
  response.headers.set("x-locale", adminLocale);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdmin(request, pathname, nonce);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/api/health"
  ) {
    return nextWithNonce(request, nonce);
  }

  const localeInPath = pathnameLocale(pathname);
  if (localeInPath) {
    return withLocaleHeader(nextWithNonce(request, nonce), localeInPath);
  }

  const locale = negotiateLocale(
    request.headers.get("accept-language"),
    request.cookies.get(LOCALE_COOKIE)?.value,
  );
  request.nextUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const redirect = NextResponse.redirect(request.nextUrl);
  return withSecurityHeaders(withLocaleHeader(redirect, locale), nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
