/**
 * Purchasing is intentionally off while catalogue details are verified.
 * Set NEXT_PUBLIC_ORDERS_ENABLED=true and rebuild to re-enable cart/checkout.
 */
export const ordersEnabled = process.env.NEXT_PUBLIC_ORDERS_ENABLED === "true";
