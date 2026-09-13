import { NextResponse } from "next/server";

import { findOrder } from "@/lib/checkout/orders";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const order = await findOrder(id);
  if (!order || order.customer.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    items: order.cart.lines.map((line) => ({
      name: line.productName,
      variant: line.variantName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    total: order.cart.total,
    currency: order.cart.currency,
    createdAt: order.createdAt,
  });
}
