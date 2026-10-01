import { unstable_cache } from "next/cache";
import { cache } from "react";

import { databaseEnabled } from "@/lib/db/enabled";
import { STORE_ORDERS_TAG, revalidateStoreOrdersFlag } from "@/lib/db/store-cache";
import {
  assertLivePaymentsForOrders,
  ordersBlockedByDemoPayments,
} from "@/lib/payments/provider";
import { auditLog } from "@/lib/security/audit";

export const ORDERS_ENABLED_KEY = "ordersEnabled";

/** Build-time / env default used when no admin setting exists yet. */
export function envOrdersEnabledDefault() {
  return process.env.NEXT_PUBLIC_ORDERS_ENABLED === "true";
}

function parseOrdersEnabled(value: string | null | undefined) {
  return value === "true";
}

/**
 * Runtime purchase flag. Admin can toggle this in the dashboard;
 * when unset in the database, falls back to NEXT_PUBLIC_ORDERS_ENABLED.
 * Production never reports enabled while only the demo payment provider exists.
 */
export const getOrdersEnabled = cache(async (): Promise<boolean> => {
  const raw = await readOrdersEnabledFlag();
  if (raw && ordersBlockedByDemoPayments()) return false;
  return raw;
});

const cachedOrdersEnabledFlag = unstable_cache(
  async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const row = await prisma.storeSetting.findUnique({
      where: { key: ORDERS_ENABLED_KEY },
    });
    if (!row) return envOrdersEnabledDefault();
    return parseOrdersEnabled(row.value);
  },
  ["store-orders-enabled"],
  { revalidate: 900, tags: [STORE_ORDERS_TAG] },
);

async function readOrdersEnabledFlag() {
  if (!databaseEnabled()) return envOrdersEnabledDefault();
  try {
    return await cachedOrdersEnabledFlag();
  } catch {
    return envOrdersEnabledDefault();
  }
}

export async function setOrdersEnabled(enabled: boolean) {
  if (!databaseEnabled()) {
    throw new Error("Database is not configured");
  }
  try {
    assertLivePaymentsForOrders(enabled);
  } catch (error) {
    auditLog({
      event: "orders_enable_blocked",
      level: "warn",
      outcome: "blocked",
      meta: { reason: "demo_payments" },
    });
    throw error;
  }
  const { prisma } = await import("@/lib/db/prisma");
  await prisma.storeSetting.upsert({
    where: { key: ORDERS_ENABLED_KEY },
    create: { key: ORDERS_ENABLED_KEY, value: enabled ? "true" : "false" },
    update: { value: enabled ? "true" : "false" },
  });
  revalidateStoreOrdersFlag();
}
