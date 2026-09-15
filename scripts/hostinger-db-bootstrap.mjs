#!/usr/bin/env node
/**
 * One-time (or after schema changes) against production Neon from your PC:
 *   npm run db:bootstrap:prod
 * Loads .env.production then .env (without overwriting existing env vars).
 */
import { spawnSync } from "node:child_process";
import { applyPrismaEnv, isPlaceholderDatabaseUrl, loadEnvFiles } from "./prisma-env.mjs";

loadEnvFiles();

try {
  applyPrismaEnv({ allowPlaceholder: false });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

if (isPlaceholderDatabaseUrl()) {
  console.error("DATABASE_URL looks like a build placeholder. Use the Neon connection string.");
  process.exit(1);
}

const pooled = (process.env.DATABASE_URL ?? "").includes("-pooler");
const unpooled = process.env.DATABASE_URL_UNPOOLED ?? "";
if (pooled && (unpooled.includes("-pooler") || unpooled === process.env.DATABASE_URL)) {
  console.warn(
    "WARN  DATABASE_URL is Neon pooled. Set DATABASE_URL_UNPOOLED to the direct (non-pooler) URI so migrations can run.",
  );
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(label, args) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(npx, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("prisma migrate deploy", ["prisma", "migrate", "deploy"]);

if (process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()) {
  run("prisma db seed", ["prisma", "db", "seed"]);
} else {
  console.log("\nSkip seed: set ADMIN_EMAIL and ADMIN_PASSWORD to seed admin + catalogue.");
}

console.log("\nDatabase bootstrap finished.");
