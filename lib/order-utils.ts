export interface CanonicalOrder {
  order_id: string;
  customer_name: string;
  total: number;
  delivery_charge: number;
  status: string;
}

/**
 * Formats a raw database order into the canonical structure requested.
 * Ensure all modules (Admin, Checkout, Notifications) use this shared logic.
 */
export function formatCanonicalOrder(order: any): CanonicalOrder {
  return {
    order_id: order.id,
    customer_name: order.customer_name || order.user_profile?.full_name || order.user_profiles?.full_name || "Guest",
    total: order.total_amount ?? order.total_price ?? 0,
    delivery_charge: order.delivery_charge ?? 0,
    status: order.status || "pending"
  };
}
