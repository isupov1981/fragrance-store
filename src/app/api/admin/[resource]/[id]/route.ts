import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRole, requireResourceMutation, type AdminResource } from "@/lib/auth/rbac";
import { hasSameOrigin, requireAdminRequest } from "@/lib/auth/server";
import { auditLog } from "@/lib/security/audit";

const resourceSchema = z.enum(["products", "categories", "brands", "orders", "customers", "content", "shipping"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const route = await params;
  const resource = resourceSchema.safeParse(route.resource);
  if (!resource.success) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const auth = requireResourceMutation(
    await requireAdminRequest(request),
    resource.data as AdminResource,
  );
  if (!auth.ok) {
    auditLog({
      event: "admin_rbac_denied",
      level: "warn",
      outcome: "blocked",
      meta: { resource: resource.data, method: "PATCH", status: auth.status },
    });
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const input = await request.json().catch(() => null);
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  const { prisma } = await import("@/lib/db/prisma");

  try {
    switch (resource.data) {
      case "products": {
        const data = z.object({ name: z.string().min(2).optional(), description: z.string().min(1).optional(), status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(), featured: z.boolean().optional(), seoTitle: z.string().nullable().optional(), seoDescription: z.string().nullable().optional() }).parse(input);
        return NextResponse.json({ data: await prisma.product.update({ where: { id: route.id }, data }) });
      }
      case "categories": {
        const data = z.object({ name: z.string().min(2).optional(), description: z.string().nullable().optional(), seoTitle: z.string().nullable().optional(), seoDescription: z.string().nullable().optional() }).parse(input);
        return NextResponse.json({ data: await prisma.category.update({ where: { id: route.id }, data }) });
      }
      case "brands": {
        const data = z.object({ name: z.string().min(2).optional(), description: z.string().nullable().optional() }).parse(input);
        return NextResponse.json({ data: await prisma.brand.update({ where: { id: route.id }, data }) });
      }
      case "orders": {
        const data = z.object({ status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]) }).parse(input);
        return NextResponse.json({ data: await prisma.order.update({ where: { id: route.id }, data }) });
      }
      case "customers": {
        const data = z.object({ name: z.string().min(2).optional(), phone: z.string().nullable().optional() }).parse(input);
        return NextResponse.json({ data: await prisma.customer.update({ where: { id: route.id }, data }) });
      }
      case "content": {
        const data = z.object({ title: z.string().min(2).optional(), content: z.string().min(1).optional(), published: z.boolean().optional(), seoTitle: z.string().nullable().optional(), seoDescription: z.string().nullable().optional() }).parse(input);
        return NextResponse.json({ data: await prisma.contentPage.update({ where: { id: route.id }, data }) });
      }
      case "shipping": {
        const data = z.object({ name: z.string().min(2).optional(), description: z.string().nullable().optional(), price: z.coerce.number().int().nonnegative().optional(), active: z.boolean().optional() }).parse(input);
        return NextResponse.json({ data: await prisma.shippingMethod.update({ where: { id: route.id }, data }) });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid data", issues: error.issues }, { status: 400 });
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const roleCheck = requireAdminRole(await requireAdminRequest(request));
  if (!roleCheck.ok) {
    auditLog({
      event: "admin_rbac_denied",
      level: "warn",
      outcome: "blocked",
      meta: { method: "DELETE", status: roleCheck.status },
    });
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }
  const route = await params;
  const resource = resourceSchema.safeParse(route.resource);
  if (!resource.success) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  if (resource.data === "orders") return NextResponse.json({ error: "Orders must be cancelled, not deleted" }, { status: 409 });
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  const { prisma } = await import("@/lib/db/prisma");
  switch (resource.data) {
    case "products": await prisma.product.delete({ where: { id: route.id } }); break;
    case "categories": await prisma.category.delete({ where: { id: route.id } }); break;
    case "brands": await prisma.brand.delete({ where: { id: route.id } }); break;
    case "customers": await prisma.customer.delete({ where: { id: route.id } }); break;
    case "content": await prisma.contentPage.delete({ where: { id: route.id } }); break;
    case "shipping": await prisma.shippingMethod.delete({ where: { id: route.id } }); break;
  }
  return new NextResponse(null, { status: 204 });
}
