/**
 * WordPress / common CMS probe paths that this Next.js app never serves.
 * Locale-prefixed variants (/en/wp-admin/…) are included.
 */
const PROBE_PATH_RE =
  /^\/(?:(?:en|he|ru)\/)?(?:wp-admin|wp-login\.php|wp-cron\.php|xmlrpc\.php|wordpress|wp-content|wp-includes)(?:\/|$)/i;

export function isCmsProbePath(pathname: string) {
  const path = pathname.split("?")[0] || "/";
  return PROBE_PATH_RE.test(path);
}
