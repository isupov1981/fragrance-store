import { NextRequest, NextResponse } from "next/server";
import { ADMIN_LOCALE_COOKIE, defaultAdminLocale, isAdminLocale } from "@/lib/admin/locale";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/session";
import { LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from "@/lib/i18n/config";
import {
  buildContentSecurityPolicy,
  buildHstsHeader,
  cspHeaderName,
} from "@/lib/security/headers";
import { isCmsProbePath } from "@/lib/security/probe-paths";
import { prefersMarkdown } from "@/lib/seo/accept";

const publicAdminPaths = new Set([
  "/admin/login",
  "/api/admin/auth/login",
  "/api/admin/health",
]);

function pathnameLocale(pathname: string): Locale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : null;
}

function isLocaleHome(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 1 && isLocale(parts[0]);
}

function withAgentDiscoveryHeaders(response: NextResponse) {
  response.headers.append("Link", '</llms.txt>; rel="describedby"; type="text/markdown"');
  response.headers.append(
    "Link",
    '</api/agent/site-markdown>; rel="alternate"; type="text/markdown"',
  );
  response.headers.append(
    "Link",
    '</.well-known/mcp/server-card.json>; rel="alternate"; type="application/json"',
  );
  response.headers.append("Link", '</server-card>; rel="alternate"; type="application/json"');
  return response;
}

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_");
}

function withSecurityHeaders(response: NextResponse, nonce: string) {
  // Hostinger CDN already sends an enforcing Content-Security-Policy
  // (`upgrade-insecure-requests`). Emitting a second nonce-based policy
  // (even Report-Only) breaks hydration in some Chromium/Electron embeds.
  // Keep the nonce for Next script attributes; only opt into our CSP when
  // explicitly enabled and Hostinger is not injecting its own.
  if (process.env.CSP_ENABLE === "true") {
    response.headers.set(cspHeaderName(), buildContentSecurityPolicy(nonce));
  }
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", buildHstsHeader());
  }
  return response;
}

function nextWithNonce(request: NextRequest, nonce: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
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

  // Drop WordPress / CMS scanners before they reach the App Router.
  // Rewrite into a Node route so the traffic summary can count them.
  if (isCmsProbePath(pathname)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/api/security/blocked";
    rewriteUrl.search = "";
    rewriteUrl.searchParams.set("path", pathname);
    return withSecurityHeaders(NextResponse.rewrite(rewriteUrl), nonce);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdmin(request, pathname, nonce);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/videos") ||
    pathname.startsWith("/.well-known") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/server-card" ||
    pathname === "/api/health"
  ) {
    return nextWithNonce(request, nonce);
  }

  const accept = request.headers.get("accept");
  if (prefersMarkdown(accept) && (pathname === "/" || isLocaleHome(pathname))) {
    const lang =
      pathname === "/"
        ? negotiateLocale(
            request.headers.get("accept-language"),
            request.cookies.get(LOCALE_COOKIE)?.value,
          )
        : (pathnameLocale(pathname) as Locale);
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/api/agent/site-markdown";
    rewriteUrl.search = "";
    rewriteUrl.searchParams.set("lang", lang);
    return withSecurityHeaders(NextResponse.rewrite(rewriteUrl), nonce);
  }

  const localeInPath = pathnameLocale(pathname);
  if (localeInPath) {
    const response = withLocaleHeader(nextWithNonce(request, nonce), localeInPath);
    if (isLocaleHome(pathname)) withAgentDiscoveryHeaders(response);
    return response;
  }

  const locale = negotiateLocale(
    request.headers.get("accept-language"),
    request.cookies.get(LOCALE_COOKIE)?.value,
  );
  request.nextUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const redirect = NextResponse.redirect(request.nextUrl);
  if (pathname === "/") withAgentDiscoveryHeaders(redirect);
  return withSecurityHeaders(withLocaleHeader(redirect, locale), nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|avif)$).*)",
  ],
};
