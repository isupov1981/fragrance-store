#!/usr/bin/env node
/**
 * Upload catalog images from public/products to S3-compatible storage (Cloudflare R2)
 * and point live product rows at the public URLs.
 *
 *   node --env-file=.env.production scripts/upload-catalog-media.mjs
 */
import { readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { PutObjectCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";
import { loadEnvFiles } from "./prisma-env.mjs";

loadEnvFiles();

const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
if (!bucket || !accessKeyId || !secretAccessKey) {
  console.error("Set S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (R2 API token).");
  process.exit(1);
}

const publicBase = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
const files = ["public/products/notre-dame.jpg"];

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  credentials: { accessKeyId, secretAccessKey },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const mime = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function main() {
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "HEAD", "PUT"],
              AllowedOrigins: [
                "https://parfums.cloud",
                "https://www.parfums.cloud",
                process.env.NEXT_PUBLIC_SITE_URL ?? "",
              ].filter(Boolean),
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 86400,
            },
          ],
        },
      }),
    );
    console.log("Updated bucket CORS");
  } catch (error) {
    console.warn("CORS update skipped:", error instanceof Error ? error.message : error);
  }

  const uploaded = [];
  for (const relative of files) {
    const absolute = resolve(process.cwd(), relative);
    const key = `products/${basename(relative)}`;
    const body = readFileSync(absolute);
    const contentType = mime[extname(relative).toLowerCase()] ?? "application/octet-stream";
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const url = publicBase ? `${publicBase}/${key}` : key;
    uploaded.push({ key, url, slug: basename(relative, extname(relative)) });
    console.log(`Uploaded ${relative} → ${url}`);
  }

  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL; skip product image URL update.");
    return;
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const item of uploaded) {
      const product = await prisma.product.findUnique({ where: { slug: item.slug } });
      if (!product) continue;
      await prisma.productImage.deleteMany({
        where: { productId: product.id, NOT: { url: item.url } },
      });
      const existing = await prisma.productImage.findFirst({
        where: { productId: product.id, url: item.url },
      });
      if (!existing) {
        await prisma.productImage.create({
          data: { productId: product.id, url: item.url, alt: product.name, position: 0 },
        });
      }
      console.log(`Product ${item.slug} image → ${item.url}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
