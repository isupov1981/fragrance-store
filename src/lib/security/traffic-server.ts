import { headers } from "next/headers";

import { recordRequestTraffic, type TrafficClass } from "@/lib/security/traffic";

/**
 * Record a storefront page hit from a Server Component (Node runtime).
 * Skips static generation / build where request headers are unavailable.
 */
export async function recordStorefrontTraffic(fallbackPathname: string) {
  try {
    const h = await headers();
    const headerList = new Headers();
    h.forEach((value, key) => headerList.set(key, value));
    const pathname = h.get("x-pathname")?.trim() || fallbackPathname;
    const request = new Request(`https://traffic.local${pathname}`, {
      method: "GET",
      headers: headerList,
    });
    recordRequestTraffic(request, { pathname });
  } catch {
    // headers() throws outside a request context (e.g. static generation).
  }
}

export function recordApiTraffic(
  request: Request,
  options?: { pathname?: string; forcedClass?: TrafficClass; status?: number },
) {
  return recordRequestTraffic(request, options);
}
