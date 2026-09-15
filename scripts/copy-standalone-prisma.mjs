#!/usr/bin/env node
/**
 * Hostinger starts Next's standalone server (not `next start` + full node_modules).
 * Prisma's query engine is a native binary and is often omitted from the trace.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

function copyDir(from, to) {
  if (!existsSync(from)) return false;
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  return true;
}

const standalone = join(process.cwd(), ".next", "standalone");
if (!existsSync(standalone)) {
  console.log("No .next/standalone output; skip Prisma copy.");
  process.exit(0);
}

const copies = [
  ["node_modules/.prisma", join(standalone, "node_modules", ".prisma")],
  ["node_modules/@prisma/client", join(standalone, "node_modules", "@prisma", "client")],
  ["prisma", join(standalone, "prisma")],
];

let copied = 0;
for (const [from, to] of copies) {
  if (copyDir(join(process.cwd(), from), to)) {
    copied += 1;
    console.log(`Copied ${from} → standalone`);
  }
}

if (copied === 0) {
  console.warn("Prisma client was not found to copy into standalone output.");
  process.exit(1);
}
