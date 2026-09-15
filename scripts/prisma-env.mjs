#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const PLACEHOLDER_URL = "postgresql://build:build@127.0.0.1:5432/build?schema=public";

export function loadEnvFiles(files = [".env.production", ".env"]) {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const trimmed = line.startsWith("export ") ? line.slice(7).trim() : line;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

export function applyPrismaEnv({ allowPlaceholder = false } = {}) {
  if (!process.env.DATABASE_URL?.trim()) {
    if (!allowPlaceholder) {
      throw new Error("DATABASE_URL is required.");
    }
    process.env.DATABASE_URL = PLACEHOLDER_URL;
  }
  if (!process.env.DATABASE_URL_UNPOOLED?.trim()) {
    process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
  }
}

export function isPlaceholderDatabaseUrl(url = process.env.DATABASE_URL) {
  return !url?.trim() || url.includes("placeholder") || url === PLACEHOLDER_URL;
}
