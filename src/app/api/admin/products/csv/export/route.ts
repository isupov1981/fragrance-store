import { requireAdminRequest } from "@/lib/auth/server";

const HEADERS = [
  "sku",
  "name",
  "slug",
  "description",
  "variantName",
  "price",
  "stock",
  "status",
  "featured",
  "brand",
  "category",
];

export async function GET(request: Request) {
  if (!(await requireAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: true,
        variants: true,
        categories: { include: { category: true } },
      },
    });
    const lines = [HEADERS.join(",")];
    for (const product of products) {
      for (const variant of product.variants) {
        lines.push(
          [
            variant.sku,
            product.name,
            product.slug,
            product.description,
            variant.name,
            (variant.price / 100).toFixed(2),
            variant.stock,
            product.status,
            product.featured,
            product.brand?.name ?? "",
            product.categories[0]?.category.name ?? "",
          ]
            .map(csvCell)
            .join(","),
        );
      }
    }
    return new Response(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="products.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Product CSV export failed", error);
    return Response.json(
      { error: "Export is unavailable while the database is offline" },
      { status: 503 },
    );
  }
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
