import { NextResponse } from "next/server";
import { z } from "zod";
import { createDraftProduct, parseAdminProductInput } from "@/lib/agent/products";
import { requireResourceMutation, type AdminResource } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import { auditLog } from "@/lib/security/audit";

export const runtime = "nodejs";

const resourceSchema = z.enum(["products", "categories", "brands", "orders", "customers", "content", "shipping"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const parsed = resourceSchema.safeParse((await params).resource);
  if (!parsed.success) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    return NextResponse.json({ data: [], demo: true });
  }
  const { prisma } = await import("@/lib/db/prisma");
  const data = await listResource(prisma, parsed.data);
  return NextResponse.json({ data });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const parsedResource = resourceSchema.safeParse((await params).resource);
  if (!parsedResource.success) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const auth = requireResourceMutation(
    await requireAdminRequest(request),
    parsedResource.data as AdminResource,
  );
  if (!auth.ok) {
    auditLog({
      event: "admin_rbac_denied",
      level: "warn",
      outcome: "blocked",
      meta: { resource: parsedResource.data, method: "POST", status: auth.status },
    });
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const { prisma } = await import("@/lib/db/prisma");

  try {
    const data = await createResource(prisma, parsedResource.data, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", issues: error.issues }, { status: 400 });
    }
    throw error;
  }
}

type Database = Awaited<typeof import("@/lib/db/prisma")>["prisma"];

function listResource(db: Database, resource: z.infer<typeof resourceSchema>) {
  switch (resource) {
    case "products": return db.product.findMany({ include: { variants: true, brand: true }, orderBy: { updatedAt: "desc" }, take: 100 });
    case "categories": return db.category.findMany({ orderBy: { name: "asc" }, take: 100 });
    case "brands": return db.brand.findMany({ orderBy: { name: "asc" }, take: 100 });
    case "orders": return db.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 100 });
    case "customers": return db.customer.findMany({ include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    case "content": return db.contentPage.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    case "shipping": return db.shippingMethod.findMany({ orderBy: { name: "asc" } });
  }
}

async function createResource(db: Database, resource: z.infer<typeof resourceSchema>, input: unknown) {
  switch (resource) {
    case "products": {
      return createDraftProduct(parseAdminProductInput(input));
    }
    case "categories": {
      const data = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), description: z.string().optional() }).parse(input);
      return db.category.create({ data });
    }
    case "brands": {
      const data = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), description: z.string().optional() }).parse(input);
      return db.brand.create({ data });
    }
    case "customers": {
      const data = z.object({ name: z.string().min(2), email: z.email(), phone: z.string().optional() }).parse(input);
      return db.customer.create({ data });
    }
    case "content": {
      const data = z.object({ title: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]+$/), content: z.string().min(1), published: z.boolean().default(false) }).parse(input);
      return db.contentPage.create({ data });
    }
    case "shipping": {
      const data = z.object({ name: z.string().min(2), code: z.string().regex(/^[a-z0-9-]+$/), description: z.string().optional(), price: z.coerce.number().int().nonnegative(), active: z.boolean().default(true) }).parse(input);
      return db.shippingMethod.create({ data });
    }
    case "orders":
      return z.never({ error: "Orders are created through checkout" }).parse(input);
  }
}
