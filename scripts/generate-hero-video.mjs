#!/usr/bin/env node
/**
 * Image → Veo clips for the homepage hero.
 *
 * Usage:
 *   node --env-file=.env scripts/generate-hero-video.mjs
 *   node --env-file=.env scripts/generate-hero-video.mjs --only angel-dust,la-sultane
 *   node --env-file=.env scripts/generate-hero-video.mjs --resolution 1080p
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "tmp", "hero-source");
const OUT_DIR = path.join(ROOT, "tmp", "hero-clips");

const DEFAULT_PROMPT =
  "Luxury perfume commercial, cinematic slow camera push-in toward the bottle, " +
  "subtle light shimmer on glass, soft bokeh, gentle atmospheric motion in the background, " +
  "premium editorial still-life coming alive, smooth elegant pacing, no text changes, " +
  "no logos added, keep product label readable and unchanged.";

const NEGATIVE_PROMPT =
  "warping bottle, morphing label, distorted text, extra fingers, people close-up, " +
  "jitter, shaky cam, low quality, watermark, logo overlay, sudden cuts";

function parseArgs(argv) {
  const out = { only: null, resolution: "1080p", aspectRatio: "16:9" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--only" && argv[i + 1]) {
      out.only = new Set(
        argv[++i]
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
    } else if (arg === "--resolution" && argv[i + 1]) {
      out.resolution = argv[++i];
    } else if (arg === "--aspect" && argv[i + 1]) {
      out.aspectRatio = argv[++i];
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stem(file) {
  return path.basename(file, path.extname(file)).toLowerCase();
}

async function loadImage(filePath) {
  const buf = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return {
    imageBytes: buf.toString("base64"),
    mimeType,
  };
}

async function pollOperation(ai, operation) {
  let current = operation;
  let ticks = 0;
  while (!current.done) {
    ticks += 1;
    process.stdout.write(`  waiting… ${ticks * 10}s\r`);
    await sleep(10_000);
    current = await ai.operations.getVideosOperation({ operation: current });
  }
  process.stdout.write("\n");
  return current;
}

async function downloadVideo(ai, video, outPath) {
  if (video?.videoBytes) {
    await writeFile(outPath, Buffer.from(video.videoBytes, "base64"));
    return;
  }
  await ai.files.download({
    file: video,
    downloadPath: outPath,
  });
}

async function generateOne(ai, model, imagePath, opts) {
  const name = stem(imagePath);
  const outPath = path.join(OUT_DIR, `${name}.mp4`);
  console.log(`\n→ ${name}`);
  console.log(`  source: ${imagePath}`);

  const image = await loadImage(imagePath);
  let operation = await ai.models.generateVideos({
    model,
    source: {
      prompt: DEFAULT_PROMPT,
      image,
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: opts.aspectRatio,
      resolution: opts.resolution,
      durationSeconds: 8,
      personGeneration: "allow_adult",
      negativePrompt: NEGATIVE_PROMPT,
    },
  });

  operation = await pollOperation(ai, operation);

  if (operation.error) {
    throw new Error(`${name}: ${JSON.stringify(operation.error)}`);
  }

  const generated = operation.response?.generatedVideos?.[0]?.video;
  if (!generated) {
    const reasons = operation.response?.raiMediaFilteredReasons?.join("; ");
    throw new Error(
      `${name}: no video returned${reasons ? ` (${reasons})` : ""}`,
    );
  }

  await downloadVideo(ai, generated, outPath);
  console.log(`  saved: ${outPath}`);
  return outPath;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in env");
    process.exit(1);
  }

  const model =
    process.env.GEMINI_VIDEO_MODEL?.trim() || "veo-3.1-generate-preview";

  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SOURCE_DIR))
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(SOURCE_DIR, f))
    .sort();

  const selected = opts.only
    ? files.filter((f) => opts.only.has(stem(f)))
    : files;

  if (!selected.length) {
    console.error("No source images matched. Put files in tmp/hero-source/");
    process.exit(1);
  }

  console.log(`Model: ${model}`);
  console.log(`Resolution: ${opts.resolution}  Aspect: ${opts.aspectRatio}`);
  console.log(`Clips: ${selected.map((f) => stem(f)).join(", ")}`);

  const ai = new GoogleGenAI({ apiKey });
  const results = [];
  for (const file of selected) {
    try {
      results.push(await generateOne(ai, model, file, opts));
    } catch (error) {
      console.error(`  FAILED: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\nDone. ${results.length}/${selected.length} clips in ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
