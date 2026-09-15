#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { applyPrismaEnv, loadEnvFiles } from "./prisma-env.mjs";

loadEnvFiles();
const args = process.argv.slice(2);
const allowPlaceholder = args[0] === "generate";
applyPrismaEnv({ allowPlaceholder });

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npx, ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
process.exit(result.status ?? 1);
