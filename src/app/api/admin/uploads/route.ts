import { NextResponse } from "next/server";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import { MAX_UPLOAD_BYTES, StorageError, storeImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64_000) {
    return NextResponse.json({ error: "Image exceeds 5 MB" }, { status: 413 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image file" }, { status: 400 });
  }

  try {
    const body = Buffer.from(await file.arrayBuffer());
    const stored = await storeImage({
      body,
      contentType: file.type,
      size: body.byteLength,
      origin: new URL(request.url).origin,
    });
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
