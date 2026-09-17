#!/usr/bin/env node
/**
 * Upload local photo → generate_product_visual via Agent API.
 * Use this from Hermes terminal when Telegram attaches a local image path.
 *
 * Usage:
 *   node generate-visual-from-file.mjs --file /path/img.jpg --mode flyer --language ru \
 *     --productName "Bleu de Chanel" --brand "Chanel" --priceLabel "from ₪32"
 *
 * Env: FRAGRANCE_API_URL, HERMES_AGENT_TOKEN
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

const file = arg("file");
const mode = arg("mode") || "beautify";
if (!file) {
  console.error("Usage: node generate-visual-from-file.mjs --file PATH --mode beautify|flyer [...]");
  process.exit(2);
}
if (mode !== "beautify" && mode !== "flyer") {
  console.error("--mode must be beautify or flyer");
  process.exit(2);
}

const api = (process.env.FRAGRANCE_API_URL || "https://parfums.cloud").replace(/\/$/, "");
const token = process.env.HERMES_AGENT_TOKEN || "";
if (token.length < 24) {
  console.error("HERMES_AGENT_TOKEN missing or too short");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const uploadScript = join(here, "upload-local-image.mjs");
const upload = spawnSync(process.execPath, [uploadScript, file], {
  encoding: "utf8",
  env: process.env,
});
if (upload.status !== 0) {
  process.stderr.write(upload.stderr || upload.stdout || "upload failed\n");
  process.exit(upload.status || 1);
}

let uploaded;
try {
  uploaded = JSON.parse(upload.stdout.trim());
} catch {
  console.error("upload did not return JSON:", upload.stdout);
  process.exit(1);
}
if (!uploaded?.url) {
  console.error("upload missing url:", upload.stdout);
  process.exit(1);
}

// Hostinger may return an internal bind origin (0.0.0.0:3000); rewrite to public API.
try {
  const parsed = new URL(uploaded.url);
  if (
    parsed.hostname === "0.0.0.0" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "localhost"
  ) {
    uploaded.url = `${api}${parsed.pathname}${parsed.search}`;
  }
} catch {
  /* keep as-is */
}

const argumentsPayload = {
  mode,
  imageUrl: uploaded.url,
};
for (const key of ["productName", "brand", "priceLabel", "language", "styleHint"]) {
  const value = arg(key);
  if (value) argumentsPayload[key] = value;
}

const response = await fetch(`${api}/api/agent`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ tool: "generate_product_visual", arguments: argumentsPayload }),
});

const text = await response.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error(text || `HTTP ${response.status}`);
  process.exit(1);
}

if (!response.ok) {
  console.error(JSON.stringify(json));
  process.exit(1);
}

process.stdout.write(
  JSON.stringify({
    upload: uploaded,
    visual: json.result ?? json,
    flyerUrl: (json.result ?? json)?.url,
  }) + "\n",
);
