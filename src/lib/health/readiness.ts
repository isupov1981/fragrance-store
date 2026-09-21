import { agentTokenConfigured } from "@/lib/agent/auth";
import { databaseEnabled } from "@/lib/db/enabled";
import { isGeminiConfigured } from "@/lib/marketing/gemini-image";
import { isGrowConfigured } from "@/lib/payments/grow";
import { isS3Configured } from "@/lib/storage";
import { SITE_VERSION } from "@/lib/version";

export async function collectReadiness() {
  const reachable = await databaseReachable();
  return {
    ok: true,
    service: "the-perfume-room",
    version: SITE_VERSION,
    time: new Date().toISOString(),
    storage: isS3Configured() ? "s3" : "local",
    database: databaseEnabled() ? "configured" : "missing",
    databaseReachable: reachable,
    payments: isGrowConfigured()
      ? "grow"
      : process.env.STRIPE_SECRET_KEY
        ? "stripe"
        : "demo",
    grow: isGrowConfigured() ? "configured" : "missing",
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "demo",
    smtp: process.env.SMTP_HOST ? "configured" : "noop",
    smtpAuth:
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? "configured"
        : "incomplete",
    hermesAgent: agentTokenConfigured() ? "configured" : "missing",
    geminiImage: isGeminiConfigured() ? "configured" : "missing",
  };
}

async function databaseReachable() {
  if (!databaseEnabled()) return null;
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await Promise.race([
      prisma.$queryRawUnsafe("SELECT 1"),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), 4000);
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}
