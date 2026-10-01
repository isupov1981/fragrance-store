import { PrismaClient } from "@prisma/client";

import { isNeonDatabaseUrl, resolvePrismaDatabaseUrl } from "./connection-url";
import { createQueryGate } from "./query-gate";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const IDLE_DISCONNECT_MS = 20_000;

const datasourceUrl = process.env.DATABASE_URL
  ? resolvePrismaDatabaseUrl(process.env.DATABASE_URL)
  : undefined;

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });
  return releaseIdleNeonConnections(base);
}

function releaseIdleNeonConnections(client: PrismaClient): PrismaClient {
  if (!isNeonDatabaseUrl(process.env.DATABASE_URL ?? "")) return client;

  const gate = createQueryGate({
    idleMs: IDLE_DISCONNECT_MS,
    disconnect: () => client.$disconnect(),
  });

  const extended = client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          await gate.begin();
          try {
            return await query(args);
          } finally {
            gate.end();
          }
        },
      },
    },
  });

  wrapRawQuery(extended, "$queryRaw", gate);
  wrapRawQuery(extended, "$queryRawUnsafe", gate);
  wrapRawQuery(extended, "$executeRaw", gate);
  wrapRawQuery(extended, "$executeRawUnsafe", gate);

  return extended as unknown as PrismaClient;
}

function wrapRawQuery(
  client: object,
  method: "$queryRaw" | "$queryRawUnsafe" | "$executeRaw" | "$executeRawUnsafe",
  gate: ReturnType<typeof createQueryGate>,
) {
  const host = client as Record<string, (...args: never[]) => Promise<unknown>>;
  const original = host[method].bind(client);
  host[method] = (async (...args: never[]) => {
    await gate.begin();
    try {
      return await original(...args);
    } finally {
      gate.end();
    }
  }) as (typeof host)[typeof method];
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
