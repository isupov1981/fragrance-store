import { NextResponse } from "next/server";

import { assertAgentRequest, jsonAgentError } from "@/lib/agent/tools";
import { MAX_UPLOAD_BYTES, StorageError, storeImage } from "@/lib/storage";
import {
  enforceRateLimit,
  rateLimitPolicies,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertAgentRequest(request);
    const limited = await enforceRateLimit(request, rateLimitPolicies.agent);
    if (!limited.ok) return rateLimitResponse(limited.result);

    if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 96_000) {
      return NextResponse.json({ error: "Image exceeds 5 MB" }, { status: 413 });
    }

    const type = request.headers.get("content-type") ?? "";
    let body: Buffer;
    let contentType: string;

    if (type.includes("application/json")) {
      const payload = (await request.json()) as { contentType?: string; data?: string; filename?: string };
      if (!payload.data) return NextResponse.json({ error: "Missing base64 data" }, { status: 400 });
      body = Buffer.from(payload.data, "base64");
      contentType = payload.contentType || "image/jpeg";
    } else {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Choose an image file" }, { status: 400 });
      }
      body = Buffer.from(await file.arrayBuffer());
      contentType = file.type;
    }

    const stored = await storeImage({
      body,
      contentType,
      size: body.byteLength,
      origin: new URL(request.url).origin,
    });
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const body = jsonAgentError(error);
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
}
