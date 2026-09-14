import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const url = process.env.LIGHTHOUSE_URL ?? `${(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/en`;
const budget = path.resolve("lighthouse-budget.json");
const report = path.resolve("lighthouse-report.json");

if (!existsSync(budget)) {
  console.error("Missing lighthouse-budget.json");
  process.exit(1);
}

const args = [
  url,
  "--budget-path",
  budget,
  "--chrome-flags=--headless --no-sandbox",
  "--output=json",
  `--output-path=${report}`,
  "--quiet",
  "--only-categories=performance,accessibility,best-practices,seo",
];

const child = spawn("npx", ["lighthouse", ...args], { stdio: "inherit", shell: true });
child.on("exit", (code) => {
  if (code === 0) console.log(`Lighthouse budgets passed for ${url}`);
  process.exit(code ?? 1);
});
