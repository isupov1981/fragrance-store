import { NextResponse } from "next/server";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import { parseProductCsv, importProducts } from "@/lib/import/products";
import { createPrismaProductRepository } from "@/lib/import/prisma-products";

const MAX_CSV_BYTES = 2_000_000;

export async function POST(request: Request) {
  const session = await requireAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "CSV exceeds 2 MB" }, { status: 413 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const confirmed = form.get("confirm") === "true";
  if (!(file instanceof File) || !confirmed) {
    return NextResponse.json(
      { error: "Preview the file, then submit it with confirm=true" },
      { status: 400 },
    );
  }
  const csv = await file.text();
  if (new TextEncoder().encode(csv).byteLength > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "CSV exceeds 2 MB" }, { status: 413 });
  }

  try {
    const parsed = parseProductCsv(csv);
    if (parsed.errors.length) {
      return NextResponse.json(
        { error: "Validation failed", errors: parsed.errors },
        { status: 422 },
      );
    }
    const repository = await createPrismaProductRepository();
    return NextResponse.json(await importProducts(parsed.rows, repository));
  } catch (error) {
    console.error("Product CSV import failed", error);
    return NextResponse.json(
      { error: "Import could not be completed" },
      { status: 503 },
    );
  }
}
