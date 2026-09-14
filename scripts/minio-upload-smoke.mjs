import { readFileSync } from "node:fs";
import { CreateBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = value;
}

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const publicBase = (process.env.S3_PUBLIC_BASE_URL || `${endpoint}/${bucket}`).replace(/\/$/, "");

if (!bucket || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
  console.error("S3 is not configured in .env");
  process.exit(1);
}

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

try {
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
} catch (error) {
  const name = error instanceof Error ? error.name : "";
  if (name !== "BucketAlreadyOwnedByYou" && name !== "BucketAlreadyExists") {
    // MinIO may return 409 with different names — continue if put works
    console.warn("CreateBucket:", name || error);
  }
}

const key = `products/smoke/${Date.now()}.png`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: png,
    ContentType: "image/png",
    CacheControl: "public, max-age=60",
  }),
);

const url = `${publicBase}/${key}`;
const response = await fetch(url);
console.log(JSON.stringify({ key, url, status: response.status, type: response.headers.get("content-type") }, null, 2));
if (!response.ok) {
  console.error("Public GET failed — check bucket anonymous download policy");
  process.exit(1);
}
console.log("MinIO upload OK");
