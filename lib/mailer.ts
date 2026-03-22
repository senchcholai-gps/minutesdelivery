import nodemailer from "nodemailer";

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  items: {
    productName: string;
    variant: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  deliveryCharge: number;
  grandTotal: number;
}

export async function sendOrderEmail(orderData: OrderEmailData) {
  try {
    const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;

    // We allow email dispatch to be skipped if credentials are not configured
    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
      console.warn("SMTP_EMAIL or SMTP_PASSWORD is not set. Skipping email notification.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });

    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          ${item.productName} ${item.variant ? `(${item.variant})` : ""}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.unitPrice}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.totalPrice}</td>
      </tr>
    `
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4CAF50;">New Order Received!</h2>
        <p><strong>Order ID:</strong> ${orderData.orderId}</p>
        
        <h3>Customer Details</h3>
        <p>
          <strong>Name:</strong> ${orderData.customerName}<br/>
          <strong>Phone:</strong> ${orderData.phoneNumber}<br/>
          <strong>Address:</strong> ${orderData.address}
        </p>

        <h3>Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; background-color: #f8f9fa; border-bottom: 2px solid #ddd;">Product</th>
              <th style="padding: 8px; text-align: center; background-color: #f8f9fa; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; background-color: #f8f9fa; border-bottom: 2px solid #ddd;">Unit Price</th>
              <th style="padding: 8px; text-align: right; background-color: #f8f9fa; border-bottom: 2px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <h3>Order Summary</h3>
        <p style="text-align: right; margin: 0;"><strong>Delivery Charge:</strong> ₹${orderData.deliveryCharge}</p>
        <p style="text-align: right; font-size: 1.2em; color: #d32f2f;"><strong>Grand Total:</strong> ₹${orderData.grandTotal}</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 0.9em; color: #777;">This is an automated message from your store's notification system.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Store Admin" <${SMTP_EMAIL}>`,
      to: SMTP_EMAIL, // Send to admin
      subject: `New Order Received - ${orderData.orderId}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Order notification sent successfully for order ${orderData.orderId}`);
  } catch (error) {
    console.error("[Email] Error sending order email:", error);
    throw error;
  }
}
