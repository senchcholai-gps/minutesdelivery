import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdminNewOrder } from "@/lib/sms";
import { sendOrderEmail } from "@/lib/mailer";
import { calculateCartTotals } from "@/lib/cart-utils";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAuthedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function createServiceClient(token: string) {
  if (SUPABASE_SERVICE_KEY) return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  return createAuthedClient(token);
}

function getToken(r: Request) {
  return r.headers.get("Authorization")?.replace("Bearer ", "").trim() || null;
}

export async function GET(request: Request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = createAuthedClient(token);
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await db
      .from("orders")
      .select("*, order_items(*, products(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Standardize GET response
    const canonical = data.map(o => ({
      order_id: o.id,
      customer_name: o.customer_name,
      total: o.total_amount,
      delivery_charge: o.delivery_charge,
      status: o.status,
      created_at: o.created_at,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      delivery_address: o.delivery_address || o.address || null,
      order_items: o.order_items
    }));

    return NextResponse.json(canonical);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Order Details (from request body)
    const body = await request.json();
    console.log("[orders POST] Incoming request body:", JSON.stringify(body, null, 2));

    const { user_id, customer_name, phone, address, total_amount, delivery_charge, payment_method, transaction_id } = body || {};

    if (!customer_name || !phone || !address || total_amount === undefined || delivery_charge === undefined || !payment_method) {
      console.error("[orders POST] Validation failed, missing fields:", body);
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    if (payment_method === "UPI" && (!transaction_id || transaction_id.trim().length < 10)) {
      console.error("[orders POST] Validation failed, invalid transaction API call:", body);
      return NextResponse.json({ error: "Valid Transaction ID is required for UPI payments" }, { status: 400 });
    }

    // 2. Fetch Global Settings
    const { data: settingsData } = await db
      .from("settings")
      .select("value")
      .eq("key", "delivery_settings")
      .single();
    const deliverySettings = settingsData?.value || { free_delivery_threshold: 499, flat_rate: 25, enabled: true, acceptingOrders: true };
    
    if (deliverySettings.acceptingOrders === false) {
      return NextResponse.json({ 
        error: "We are currently not accepting orders. Please try again later." 
      }, { status: 403 });
    }

    // 3. Cart items
    const { data: cartItems, error: cartError } = await db
      .from("cart")
      .select("*, products(id, name, delivery_charge, variant_options)")
      .eq("user_id", user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 4. Compute totals with variant pricing using centralized utility
    const formattedItems = cartItems.map((item: any) => {
      const product = item.products;
      const variant = Array.isArray(product?.variant_options)
        ? product.variant_options.find((v: any) => v.label === item.variant_label)
        : null;
      const unit_price = variant?.price ?? 0;
      return { ...item, unit_price, delivery_charge: product?.delivery_charge ?? 0 };
    });

    const { subtotal, deliveryCharge, total } = calculateCartTotals(formattedItems, deliverySettings);

    const orderItemsPayload = formattedItems.map((item: any) => {
      const line_total = item.unit_price * item.quantity;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        variant_label: item.variant_label || null,
        product_name: item.products?.name || "Unknown",
        unit_price: item.unit_price,
        delivery_charge: item.delivery_charge, // Keeping snapshotted product charge for legacy, though global is used for total
        total_price: line_total,
      };
    });

    const adminDb = createServiceClient(token);

    // 5. Create order
    const orderPayload = { 
      user_id: user.id,
      customer_name,
      phone,
      address,
      total_amount: total, // Use backend computed total
      delivery_charge: deliveryCharge, // Use backend computed delivery charge
      status: "pending", 
      payment_method,
      payment_status: "pending",
      transaction_id: transaction_id || null,
      // Fix: Use verified total for total_price column as well
      total_price: total, 
      delivery_address: address,
    };

    console.log("[orders POST] Executing INSERT INTO orders with payload:", JSON.stringify(orderPayload, null, 2));

    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) {
      console.error("[orders POST] order insert:", JSON.stringify(orderError));
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 5. Insert order_items with full snapshot
    const itemsWithOrderId = orderItemsPayload.map((i) => ({ ...i, order_id: order.id }));
    const { error: itemsError } = await adminDb.from("order_items").insert(itemsWithOrderId);

    if (itemsError) {
      console.error("[orders POST] items insert:", JSON.stringify(itemsError));
      await adminDb.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 6. Clear cart
    await db.from("cart").delete().eq("user_id", user.id);

    // 7. SMS (non-blocking)
    notifyAdminNewOrder({
      orderId: order.id,
      customerName: customer_name,
      totalPrice: total,
      itemCount: cartItems.length,
      deliveryAddress: address,
    }).catch((e: any) => console.error("[SMS] failed:", e?.message));

    // 8. Email (non-blocking)
    const orderDataForEmail = {
      orderId: order.id, 
      customerName: customer_name,
      phoneNumber: phone,
      address: address,
      items: orderItemsPayload.map((item: any) => ({
        productName: item.product_name,
        variant: item.variant_label,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
      })),
      deliveryCharge: deliveryCharge,
      grandTotal: total,
    };

    sendOrderEmail(orderDataForEmail).catch((e: any) => console.error("[Email] failed:", e?.message));

    // Fix total_price consistency in the return object if it wasn't already synced in DB
    const canonicalResponse = {
      order_id: order.id,
      customer_name: order.customer_name,
      total: order.total_amount,
      delivery_charge: order.delivery_charge,
      status: order.status
    };

    return NextResponse.json(canonicalResponse);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
