import { resolveTrafficCountry } from "@/lib/security/geo-country";

export type TrafficClass = "infra" | "bot" | "scanner" | "human" | "other";

export type TrafficSample = {
  ts: number;
  class: TrafficClass;
  country: string;
  path: string;
  method: string;
  uaFamily: string;
  ipHash: string;
  status?: number;
};

export type TrafficSummary = {
  windowHours: number;
  sampleCount: number;
  uniqueIpHashes: number;
  byClass: Record<TrafficClass, number>;
  byCountry: Array<{ country: string; count: number; classes: Partial<Record<TrafficClass, number>> }>;
  topPaths: Array<{ path: string; count: number; class: TrafficClass }>;
  topUaFamilies: Array<{ uaFamily: string; count: number; class: TrafficClass }>;
  note: string;
};

const MAX_SAMPLES = 2_000;
const DEFAULT_WINDOW_MS = 6 * 60 * 60_000;

type TrafficStore = {
  samples: TrafficSample[];
};

const globalKey = "__fragrance_traffic_samples__";

function store(): TrafficStore {
  const g = globalThis as typeof globalThis & { [globalKey]?: TrafficStore };
  if (!g[globalKey]) g[globalKey] = { samples: [] };
  return g[globalKey];
}

/** Test helper */
export function resetTrafficSamples() {
  store().samples = [];
}

export function clientIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export { countryFromHeaders } from "@/lib/security/geo-country";

/** Non-cryptographic stable hash — avoids storing raw IPs in the admin UI. */
export function hashIp(ip: string) {
  const salt = (process.env.AUTH_SECRET || "traffic").slice(0, 12);
  let h = 2166136261;
  const input = `${salt}:${ip}`;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function uaFamily(userAgent: string | null | undefined) {
  const ua = (userAgent || "").trim();
  if (!ua) return "empty";
  const lower = ua.toLowerCase();
  if (lower.includes("python-httpx")) return "python-httpx";
  if (lower.startsWith("curl/")) return "curl";
  if (lower.includes("ahrefsbot")) return "ahrefsbot";
  if (lower.includes("facebookexternalhit") || lower.includes("meta-externalagent")) {
    return "facebook-crawler";
  }
  if (lower.includes("googlebot")) return "googlebot";
  if (lower.includes("bingbot")) return "bingbot";
  if (lower.includes("claudebot")) return "claudebot";
  if (lower.includes("gptbot")) return "gptbot";
  if (lower.includes("exasearchbot")) return "exa-bot";
  if (lower.includes("guzzlehttp")) return "guzzlehttp";
  if (lower.includes("amle-sitecheck")) return "site-check-bot";
  if (lower.includes("wp-admin") || lower.includes("install.php")) return "wp-probe-ua";
  if (lower.includes("mozilla/")) {
    if (lower.includes("edg/")) return "edge";
    if (lower.includes("firefox/")) return "firefox";
    if (lower.includes("chrome/")) return "chrome";
    if (lower.includes("safari/") && !lower.includes("chrome/")) return "safari";
    return "browser";
  }
  return "other";
}

export function normalizeTrafficPath(pathname: string) {
  const raw = (pathname.split("?")[0] || "/").replace(/\/{2,}/g, "/");
  if (raw.length <= 96) return raw;
  return `${raw.slice(0, 93)}...`;
}

function isHostingerInfraIp(ip: string) {
  return ip.startsWith("2a02:4780:");
}

function isInfraPath(pathname: string) {
  return (
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/agent/") ||
    pathname === "/api/health" ||
    pathname === "/api/admin/health"
  );
}

export function classifyTraffic(input: {
  pathname: string;
  userAgent?: string | null;
  ip?: string;
  forcedClass?: TrafficClass;
}): TrafficClass {
  if (input.forcedClass) return input.forcedClass;
  const path = normalizeTrafficPath(input.pathname);
  const ua = (input.userAgent || "").toLowerCase();
  const ip = input.ip || "";
  const family = uaFamily(input.userAgent);

  if (isInfraPath(path) || family === "python-httpx" || family === "curl" || isHostingerInfraIp(ip)) {
    return "infra";
  }
  if (
    path.includes("wp-admin") ||
    path.includes("wp-login") ||
    path.includes("xmlrpc") ||
    family === "wp-probe-ua" ||
    family === "site-check-bot"
  ) {
    return "scanner";
  }
  if (
    family === "ahrefsbot" ||
    family === "facebook-crawler" ||
    family === "googlebot" ||
    family === "bingbot" ||
    family === "claudebot" ||
    family === "gptbot" ||
    family === "exa-bot" ||
    family === "guzzlehttp"
  ) {
    return "bot";
  }
  if (family === "chrome" || family === "firefox" || family === "safari" || family === "edge" || family === "browser") {
    return "human";
  }
  return "other";
}

export function recordTrafficSample(sample: Omit<TrafficSample, "ts"> & { ts?: number }) {
  const bucket = store();
  bucket.samples.push({
    ts: sample.ts ?? Date.now(),
    class: sample.class,
    country: sample.country || "??",
    path: normalizeTrafficPath(sample.path),
    method: sample.method || "GET",
    uaFamily: sample.uaFamily,
    ipHash: sample.ipHash,
    status: sample.status,
  });
  if (bucket.samples.length > MAX_SAMPLES) {
    bucket.samples.splice(0, bucket.samples.length - MAX_SAMPLES);
  }
}

export function recordRequestTraffic(
  request: Request,
  options?: { pathname?: string; forcedClass?: TrafficClass; status?: number },
) {
  const url = new URL(request.url);
  const pathname = options?.pathname || url.pathname;
  const headers = request.headers;
  const ip = clientIpFromHeaders(headers);
  const userAgent = headers.get("user-agent");
  const trafficClass = classifyTraffic({
    pathname,
    userAgent,
    ip,
    forcedClass: options?.forcedClass,
  });
  recordTrafficSample({
    class: trafficClass,
    country: resolveTrafficCountry(headers, ip),
    path: pathname,
    method: request.method,
    uaFamily: uaFamily(userAgent),
    ipHash: hashIp(ip),
    status: options?.status,
  });
  return trafficClass;
}

function emptyByClass(): Record<TrafficClass, number> {
  return { infra: 0, bot: 0, scanner: 0, human: 0, other: 0 };
}

export function getTrafficSummary(windowMs = DEFAULT_WINDOW_MS): TrafficSummary {
  const cutoff = Date.now() - windowMs;
  const samples = store().samples.filter((s) => s.ts >= cutoff);
  const byClass = emptyByClass();
  const countryMap = new Map<string, { count: number; classes: Partial<Record<TrafficClass, number>> }>();
  const pathMap = new Map<string, { count: number; class: TrafficClass }>();
  const uaMap = new Map<string, { count: number; class: TrafficClass }>();
  const ips = new Set<string>();

  for (const sample of samples) {
    byClass[sample.class] += 1;
    ips.add(sample.ipHash);

    const country = countryMap.get(sample.country) || { count: 0, classes: {} };
    country.count += 1;
    country.classes[sample.class] = (country.classes[sample.class] || 0) + 1;
    countryMap.set(sample.country, country);

    const pathKey = `${sample.method} ${sample.path}`;
    const pathEntry = pathMap.get(pathKey) || { count: 0, class: sample.class };
    pathEntry.count += 1;
    pathMap.set(pathKey, pathEntry);

    const uaEntry = uaMap.get(sample.uaFamily) || { count: 0, class: sample.class };
    uaEntry.count += 1;
    uaMap.set(sample.uaFamily, uaEntry);
  }

  const byCountry = [...countryMap.entries()]
    .map(([country, value]) => ({ country, count: value.count, classes: value.classes }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topPaths = [...pathMap.entries()]
    .map(([path, value]) => ({ path, count: value.count, class: value.class }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const topUaFamilies = [...uaMap.entries()]
    .map(([uaFamilyName, value]) => ({
      uaFamily: uaFamilyName,
      count: value.count,
      class: value.class,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    windowHours: Math.round(windowMs / 3_600_000),
    sampleCount: samples.length,
    uniqueIpHashes: ips.size,
    byClass,
    byCountry,
    topPaths,
    topUaFamilies,
    note: "Process-local samples (no raw IPs). Country from CDN headers or local GeoIP. Resets on redeploy.",
  };
}
