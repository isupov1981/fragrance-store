import { isS3Configured } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const databaseConfigured = Boolean(
    process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("placeholder"),
  );
  return Response.json({
    ok: true,
    service: "prive-atelier",
    time: new Date().toISOString(),
    storage: isS3Configured() ? "s3" : "local",
    database: databaseConfigured ? "configured" : "missing",
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "demo",
    smtp: process.env.SMTP_HOST ? "configured" : "noop",
  });
}
