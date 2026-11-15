import { afterEach, describe, expect, it } from "vitest";

import { isCmsProbePath } from "@/lib/security/probe-paths";
import {
  classifyTraffic,
  getTrafficSummary,
  hashIp,
  recordTrafficSample,
  resetTrafficSamples,
  uaFamily,
} from "@/lib/security/traffic";

afterEach(() => {
  resetTrafficSamples();
});

describe("isCmsProbePath", () => {
  it("blocks WordPress and locale-prefixed probes", () => {
    expect(isCmsProbePath("/wp-admin/install.php")).toBe(true);
    expect(isCmsProbePath("/en/wp-admin/install.php")).toBe(true);
    expect(isCmsProbePath("/he/wp-login.php")).toBe(true);
    expect(isCmsProbePath("/xmlrpc.php")).toBe(true);
    expect(isCmsProbePath("/en/products/foo")).toBe(false);
    expect(isCmsProbePath("/api/checkout")).toBe(false);
  });
});

describe("traffic classification", () => {
  it("labels Hostinger cron/agent as infra", () => {
    expect(
      classifyTraffic({
        pathname: "/api/cron/inventory-reservations",
        userAgent: "curl/7.88.1",
        ip: "2a02:4780:79:2f03::1",
      }),
    ).toBe("infra");
    expect(
      classifyTraffic({
        pathname: "/api/agent/mcp",
        userAgent: "python-httpx2/2.7.0",
      }),
    ).toBe("infra");
  });

  it("labels CMS and crawler traffic", () => {
    expect(
      classifyTraffic({
        pathname: "/wp-admin/install.php",
        userAgent: "Mozilla/5.0",
      }),
    ).toBe("scanner");
    expect(
      classifyTraffic({
        pathname: "/robots.txt",
        userAgent: "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      }),
    ).toBe("bot");
  });

  it("labels browser catalogue browsing as human", () => {
    expect(
      classifyTraffic({
        pathname: "/en/collections/all",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
      }),
    ).toBe("human");
    expect(uaFamily("Mozilla/5.0 (compatible; AMLE-SiteCheck/1.0)")).toBe("site-check-bot");
  });

  it("summarizes samples without raw IPs", () => {
    recordTrafficSample({
      class: "infra",
      country: "DE",
      path: "/api/agent/mcp",
      method: "POST",
      uaFamily: "python-httpx",
      ipHash: hashIp("2a02:4780:79:2f03::1"),
    });
    recordTrafficSample({
      class: "human",
      country: "IL",
      path: "/en/collections/all",
      method: "GET",
      uaFamily: "chrome",
      ipHash: hashIp("176.230.158.200"),
    });
    recordTrafficSample({
      class: "scanner",
      country: "SE",
      path: "/wp-admin/install.php",
      method: "GET",
      uaFamily: "wp-probe-ua",
      ipHash: hashIp("104.23.217.77"),
    });

    const summary = getTrafficSummary(6 * 3_600_000);
    expect(summary.sampleCount).toBe(3);
    expect(summary.byClass.infra).toBe(1);
    expect(summary.byClass.human).toBe(1);
    expect(summary.byClass.scanner).toBe(1);
    expect(summary.byCountry[0]?.country).toBeTruthy();
    expect(JSON.stringify(summary)).not.toContain("176.230.158.200");
    expect(JSON.stringify(summary)).not.toContain("2a02:4780");
  });
});
