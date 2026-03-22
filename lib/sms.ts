/**
 * Sends an SMS notification using Twilio.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER and ADMIN_PHONE_NUMBER in .env.local
 */
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    console.warn("[SMS] Twilio env vars not configured. Skipping SMS.")
    return { success: false, error: "Twilio not configured" }
  }

  if (!to) {
    console.warn("[SMS] No recipient phone number provided.")
    return { success: false, error: "No recipient" }
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: message }).toString(),
    })

    if (!res.ok) {
      const data = await res.json()
      console.error("[SMS] Twilio API error:", data.message)
      return { success: false, error: data.message }
    }

    console.log("[SMS] Sent successfully to", to)
    return { success: true }
  } catch (err: any) {
    console.error("[SMS] Failed to send:", err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Sends an order notification SMS to the admin.
 */
export async function notifyAdminNewOrder(orderDetails: {
  orderId: string
  customerName: string
  totalPrice: number
  itemCount: number
  deliveryAddress: string
}) {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER
  if (!adminPhone) {
    console.warn("[SMS] ADMIN_PHONE_NUMBER not set. Skipping admin notification.")
    return
  }

  const msg = [
    `🛒 NEW ORDER ALERT`,
    `Order: #${orderDetails.orderId}`,
    `Customer: ${orderDetails.customerName}`,
    `Items: ${orderDetails.itemCount} item${orderDetails.itemCount !== 1 ? "s" : ""}`,
    `Total: ₹${orderDetails.totalPrice}`,
    `Address: ${orderDetails.deliveryAddress.slice(0, 80)}`,
  ].join("\n")

  return sendSMS(adminPhone, msg)
}
