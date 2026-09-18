#!/usr/bin/env node
/**
 * Upload a local image file to The Perfume Room agent API (multipart),
 * bypassing MCP/LLM base64 truncation.
 *
 * Usage:
 *   node upload-local-image.mjs /path/to/photo.jpg
 *
 * Env (from Hermes profile .env):
 *   FRAGRANCE_API_URL   e.g. https://parfums.cloud
 *   HERMES_AGENT_TOKEN  Bearer token (≥24 chars)
 *
 * Prints JSON: { key, url }
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { File } from "node:buffer";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node upload-local-image.mjs <file>");
  process.exit(2);
}

const api = (process.env.FRAGRANCE_API_URL || "https://parfums.cloud").replace(/\/$/, "");
const token = process.env.HERMES_AGENT_TOKEN || "";
if (token.length < 24) {
  console.error("HERMES_AGENT_TOKEN missing or too short");
  process.exit(1);
}

const buf = readFileSync(filePath);
if (buf.byteLength < 8 * 1024 || buf.byteLength > 5 * 1024 * 1024) {
  console.error("Image must be between 8 KB and 5 MB");
  process.exit(1);
}

const ext = extname(filePath).toLowerCase();
const contentType =
  ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

const form = new FormData();
form.append(
  "file",
  new File([buf], basename(filePath) || "photo.jpg", { type: contentType }),
);

const response = await fetch(`${api}/api/agent/upload`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: form,
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

// Hostinger may return an internal bind origin; rewrite to public API URL.
try {
  const parsed = new URL(json.url);
  if (
    parsed.hostname === "0.0.0.0" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "localhost"
  ) {
    json.url = `${api}${parsed.pathname}${parsed.search}`;
  }
} catch {
  /* keep as-is */
}

process.stdout.write(JSON.stringify(json) + "\n");
