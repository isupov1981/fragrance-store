#!/usr/bin/env node
/**
 * Prints whether required production / MinIO env vars are present.
 * Does not print secret values.
 */
const requiredAlways = ["AUTH_SECRET", "NEXT_PUBLIC_SITE_URL", "DATABASE_URL"];
const s3Keys = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_ENDPOINT", "S3_PUBLIC_BASE_URL"];
const growKeys = ["GROW_USER_ID", "GROW_PAGE_CODE", "GROW_WEBHOOK_SECRET"];
const stripeKeys = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
const smtpKeys = ["SMTP_HOST", "SMTP_PORT", "EMAIL_FROM"];
const hermesKeys = ["HERMES_AGENT_TOKEN"];

function present(name) {
  const value = process.env[name];
  return Boolean(value && String(value).trim());
}

function report(label, keys) {
  const rows = keys.map((key) => ({ key, ok: present(key) }));
  const missing = rows.filter((row) => !row.ok).map((row) => row.key);
  console.log(`\n${label}`);
  for (const row of rows) {
    console.log(`  ${row.ok ? "ok " : "MISSING"}  ${row.key}`);
  }
  return missing;
}

const missing = [
  ...report("Core", requiredAlways),
  ...report("Object storage (MinIO / S3)", s3Keys),
  ...report("Grow Light API (empty = skip; preferred Israeli acquirer)", growKeys),
  ...report("Stripe (empty = unused)", stripeKeys),
  ...report("SMTP (empty SMTP_HOST = noop mailer)", smtpKeys),
  ...report("Hermes Agent (empty = Telegram operator disabled)", hermesKeys),
];

if (present("DATABASE_URL") && process.env.DATABASE_URL.includes("-pooler") && !present("DATABASE_URL_UNPOOLED")) {
  console.log("\nWARN  DATABASE_URL is Neon pooled; set DATABASE_URL_UNPOOLED (direct host, no -pooler) for migrations.");
}

const auth = process.env.AUTH_SECRET ?? "";
if (auth && auth.length < 32) {
  console.log("\nWARN  AUTH_SECRET should be at least 32 characters");
}

const storage = present("S3_BUCKET") && present("S3_ACCESS_KEY_ID") && present("S3_SECRET_ACCESS_KEY")
  ? "s3"
  : "local";
console.log(`\nResolved storage backend: ${storage}`);

if (missing.includes("AUTH_SECRET") || missing.includes("DATABASE_URL") || missing.includes("NEXT_PUBLIC_SITE_URL")) {
  console.error("\nCore production variables are incomplete.");
  process.exit(1);
}

console.log("\nEnv check finished.");
