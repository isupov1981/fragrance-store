import { agentTokenConfigured } from "@/lib/agent/auth";
import { databaseEnabled } from "@/lib/db/enabled";
import { isS3Configured } from "@/lib/storage";

export const runtime = "nodejs";

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

export async function GET() {
  const reachable = await databaseReachable();
  return Response.json({
    ok: true,
    service: "prive-atelier",
    time: new Date().toISOString(),
    storage: isS3Configured() ? "s3" : "local",
    database: databaseEnabled() ? "configured" : "missing",
    databaseReachable: reachable,
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "demo",
    smtp: process.env.SMTP_HOST ? "configured" : "noop",
    hermesAgent: agentTokenConfigured() ? "configured" : "missing",
  });
}
