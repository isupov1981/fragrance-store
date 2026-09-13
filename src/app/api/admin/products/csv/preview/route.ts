import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/auth/server";
import { parseProductCsv } from "@/lib/import/products";

const MAX_CSV_BYTES = 2_000_000;

export async function POST(request: Request) {
  if (!(await requireAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "CSV exceeds 2 MB" }, { status: 413 });
  }

  const csv = await readCsv(request);
  if (!csv || new TextEncoder().encode(csv).byteLength > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "A CSV file under 2 MB is required" }, { status: 400 });
  }

  try {
    const result = parseProductCsv(csv);
    return NextResponse.json({
      ...result,
      rows: result.rows.slice(0, 20),
      previewLimit: 20,
    });
  } catch {
    return NextResponse.json({ error: "Malformed CSV" }, { status: 400 });
  }
}

async function readCsv(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const file = (await request.formData()).get("file");
    return file instanceof File ? file.text() : "";
  }
  return request.text();
}
