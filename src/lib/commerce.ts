/**
 * When false, the storefront is browse-only: catalogue and product pages stay
 * available, but cart, checkout and order creation are disabled.
 * Set NEXT_PUBLIC_ORDERS_ENABLED=true to re-enable purchasing.
 */
export const ordersEnabled = process.env.NEXT_PUBLIC_ORDERS_ENABLED === "true";
