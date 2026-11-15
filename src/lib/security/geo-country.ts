/**
 * Resolve ISO country codes for traffic samples.
 * Prefers CDN geo headers; falls back to a local MaxMind-derived DB (geoip-lite).
 * Raw IPs are never persisted — only the two-letter country code is stored.
 */

type GeoLookup = { country?: string } | null;

type GeoIpLite = {
  lookup: (ip: string) => GeoLookup;
};

const cacheKey = "__fragrance_geo_country_cache__";
const MAX_CACHE = 4_000;

function cacheStore() {
  const g = globalThis as typeof globalThis & { [cacheKey]?: Map<string, string> };
  if (!g[cacheKey]) g[cacheKey] = new Map();
  return g[cacheKey];
}

function isNonPublicIp(ip: string) {
  if (!ip || ip === "unknown") return true;
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("127.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  return false;
}

function loadGeoIp(): GeoIpLite | null {
  try {
    // Lazy require keeps Edge bundles from pulling the country DB.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("geoip-lite") as GeoIpLite;
  } catch {
    return null;
  }
}

/** Test helper */
export function resetGeoCountryCache() {
  cacheStore().clear();
}

export function countryFromIp(ip: string): string {
  const value = ip.trim();
  if (isNonPublicIp(value)) return "??";

  const cache = cacheStore();
  const cached = cache.get(value);
  if (cached) return cached;

  let country = "??";
  const geo = loadGeoIp();
  if (geo) {
    try {
      const hit = geo.lookup(value);
      if (hit?.country) country = hit.country.toUpperCase();
    } catch {
      country = "??";
    }
  }

  if (cache.size >= MAX_CACHE) cache.clear();
  cache.set(value, country);
  return country;
}

export function countryFromHeaders(headers: Headers) {
  const header =
    headers.get("x-country-code")?.trim() ||
    headers.get("cf-ipcountry")?.trim() ||
    headers.get("x-vercel-ip-country")?.trim() ||
    headers.get("x-appengine-country")?.trim() ||
    "";
  if (!header || header === "XX" || header === "T1") return "??";
  return header.toUpperCase();
}

/** Header first, then local GeoIP fallback. */
export function resolveTrafficCountry(headers: Headers, ip: string) {
  const fromHeader = countryFromHeaders(headers);
  if (fromHeader !== "??") return fromHeader;
  return countryFromIp(ip);
}
