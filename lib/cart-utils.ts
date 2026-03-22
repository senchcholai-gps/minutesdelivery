export interface DeliverySettings {
  free_delivery_threshold: number;
  flat_rate: number;
  enabled: boolean;
  acceptingOrders: boolean;
}

/**
 * Single, consistent delivery logic for the entire system.
 * Rules:
 * - If any product in cart has "Free Delivery" (delivery_charge === 0), delivery is ₹0.
 * - Else if cart subtotal >= threshold, delivery is ₹0.
 * - Otherwise, apply the standard delivery charge once per order.
 */
export function calculateCartTotals(items: any[], settings: DeliverySettings) {
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0);

  let deliveryCharge = 0;
  if (items.length > 0) {
    // Check if any product has "Free Delivery" override (charge set to 0)
    const hasFreeProduct = items.some((i: any) => i.delivery_charge === 0);

    if (hasFreeProduct || subtotal >= settings.free_delivery_threshold) {
      deliveryCharge = 0;
    } else {
      deliveryCharge = settings.flat_rate;
    }
  }

  return {
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
  };
}
