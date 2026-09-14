import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { absoluteUploadPath } from "@/lib/storage/local";
import { ALLOWED_IMAGE_TYPES, StorageError } from "@/lib/storage/validate";

export const runtime = "nodejs";

const types = Object.fromEntries(
  Object.entries(ALLOWED_IMAGE_TYPES).map(([mime, ext]) => [ext, mime]),
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const key = (await params).key.join("/");
  try {
    const file = await readFile(absoluteUploadPath(key));
    const ext = key.split(".").pop() ?? "";
    const contentType = types[ext] ?? "application/octet-stream";
    return new NextResponse(Uint8Array.from(file), {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
