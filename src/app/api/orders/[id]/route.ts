import { NextResponse } from "next/server";

import { findOrder } from "@/lib/checkout/orders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await findOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    items: order.cart.lines,
    subtotal: order.cart.subtotal,
    shippingTotal: order.cart.shippingTotal,
    total: order.cart.total,
    currency: order.cart.currency,
    createdAt: order.createdAt,
  });
}
