#!/usr/bin/env node
/**
 * Generate Logo.mp4-style hero clips for ANFAS / Notre-Dame / Rabbit.
 * High-res Veo image→video for homepage.
 *
 * Usage:
 *   node --env-file=.env scripts/generate-logo3-videos.mjs
 *   node --env-file=.env scripts/generate-logo3-videos.mjs --resolution 4k
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "tmp", "hero-source-logo3");
const OUT_DIR = path.join(ROOT, "tmp", "hero-clips-logo3");
const PUBLIC_DIR = path.join(ROOT, "public", "videos", "hero");

const NEGATIVE_PROMPT =
  "warping bottle, morphing label, distorted text, unreadable logo, extra fingers, " +
  "wrong animal, jitter, shaky cam, low quality, watermark, sudden cuts, cartoon";

const CLIPS = [
  {
    file: "anfas-ishq.jpg",
    out: "anfas-ishq.mp4",
    prompt:
      "Ultra luxury perfume commercial matching a high-end gourmand hero film. " +
      "Keep the exact ANFAS gold bottle, red wax seal and label unchanged and sharp. " +
      "Cinematic slow motion: thick white cream pours over the ornate gold cap and drips " +
      "down the bottle sides; raspberries drift and settle; soft jasmine petals stir; " +
      "vanilla pods catch light. Warm chiaroscuro lighting, shallow depth of field, " +
      "rich gold and crimson palette, 24fps feel, elegant camera push-in, no text changes.",
  },
  {
    file: "notre-dame.jpg",
    out: "notre-dame.mp4",
    prompt:
      "Ultra luxury perfume commercial matching a gothic sacristy hero film. " +
      "Keep the exact Filippo Sorcinelli Memento Notre-Dame bottle with golden blessing hand, " +
      "filigree band and parchment box with red Notre Dame wax seal unchanged and readable. " +
      "Cinematic slow motion inside a cathedral: incense smoke drifts, candle flames flicker, " +
      "a shaft of god-ray light moves across the gold hand, subtle camera orbit. " +
      "Dark stone, stained glass bokeh, solemn sacred atmosphere, ultra sharp product detail.",
  },
  {
    file: "rabbit.jpg",
    out: "rabbit.mp4",
    prompt:
      "Ultra luxury perfume commercial matching a whimsical fairytale hero film. " +
      "Keep the exact Zoologist Rabbit bottle, gold cap and label illustration unchanged and sharp. " +
      "Cinematic slow motion: the white rabbit with pink bow breathes softly, white butterflies " +
      "flutter, carrot greens sway, tiny magical sparkles drift in warm bokeh light. " +
      "Gentle camera push-in on marble and gold tray, soft dreamy atmosphere, premium editorial.",
  },
];

function parseArgs(argv) {
  const out = { resolution: "4k", aspectRatio: "16:9", only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--resolution" && argv[i + 1]) out.resolution = argv[++i];
    else if (arg === "--aspect" && argv[i + 1]) out.aspectRatio = argv[++i];
    else if (arg === "--only" && argv[i + 1]) {
      out.only = new Set(
        argv[++i]
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadImage(filePath) {
  const buf = await readFile(filePath);
  return { imageBytes: buf.toString("base64"), mimeType: "image/jpeg" };
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
  await ai.files.download({ file: video, downloadPath: outPath });
}

async function generateOne(ai, model, clip, opts) {
  const imagePath = path.join(SOURCE_DIR, clip.file);
  const outPath = path.join(OUT_DIR, clip.out);
  console.log(`\n→ ${clip.out}`);
  console.log(`  source: ${imagePath}`);

  const image = await loadImage(imagePath);
  let operation = await ai.models.generateVideos({
    model,
    source: { prompt: clip.prompt, image },
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
  if (operation.error) throw new Error(JSON.stringify(operation.error));

  const generated = operation.response?.generatedVideos?.[0]?.video;
  if (!generated) {
    const reasons = operation.response?.raiMediaFilteredReasons?.join("; ");
    throw new Error(`no video${reasons ? ` (${reasons})` : ""}`);
  }

  await downloadVideo(ai, generated, outPath);
  await writeFile(path.join(PUBLIC_DIR, clip.out), await readFile(outPath));
  console.log(`  saved: ${outPath}`);
  console.log(`  public: ${path.join(PUBLIC_DIR, clip.out)}`);
  return outPath;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
  }
  const model =
    process.env.GEMINI_VIDEO_MODEL?.trim() || "veo-3.1-generate-preview";

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  let clips = CLIPS;
  if (opts.only) {
    clips = CLIPS.filter((c) => opts.only.has(path.basename(c.out, ".mp4")));
  }

  console.log(`Model: ${model}`);
  console.log(`Resolution: ${opts.resolution}  Aspect: ${opts.aspectRatio}`);
  console.log(`Clips: ${clips.map((c) => c.out).join(", ")}`);

  const ai = new GoogleGenAI({ apiKey });
  let ok = 0;
  for (const clip of clips) {
    try {
      await generateOne(ai, model, clip, opts);
      ok += 1;
    } catch (error) {
      console.error(`  FAILED: ${error instanceof Error ? error.message : error}`);
    }
  }
  console.log(`\nDone. ${ok}/${clips.length} clips`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
