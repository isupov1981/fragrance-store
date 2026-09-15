const DEFAULT_CONNECTION_LIMIT = "5";

export function resolvePrismaDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const neon = parsed.hostname.includes("neon.tech") || parsed.hostname.includes("neon.build");
    const pooled = parsed.hostname.includes("-pooler");

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT ?? DEFAULT_CONNECTION_LIMIT);
    }
    if (pooled && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    if ((neon || pooled) && !parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    if (neon && !parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "10");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isPooledDatabaseUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("-pooler");
  } catch {
    return url.includes("-pooler");
  }
}
