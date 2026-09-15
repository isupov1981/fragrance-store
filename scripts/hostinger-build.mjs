#!/usr/bin/env node
/**
 * Hostinger Business (and Docker) production build:
 * generate Prisma client even without a live DB, build Next standalone, copy engines.
 */
import { spawnSync } from "node:child_process";
import { applyPrismaEnv, isPlaceholderDatabaseUrl, loadEnvFiles } from "./prisma-env.mjs";

loadEnvFiles();
applyPrismaEnv({ allowPlaceholder: true });

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(npx, ["prisma", "generate"]);

const migrate =
  process.env.HOSTINGER_MIGRATE_ON_BUILD === "1" || process.env.HOSTINGER_MIGRATE_ON_BUILD === "true";
if (migrate) {
  if (isPlaceholderDatabaseUrl()) {
    console.error("HOSTINGER_MIGRATE_ON_BUILD is set but DATABASE_URL is missing/placeholder.");
    process.exit(1);
  }
  applyPrismaEnv({ allowPlaceholder: false });
  run(npx, ["prisma", "migrate", "deploy"]);
}

run(npx, ["next", "build"]);
run(process.execPath, ["scripts/copy-standalone-prisma.mjs"]);
