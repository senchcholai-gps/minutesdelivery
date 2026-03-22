import { NextResponse } from "next/server";
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

// ─── helpers ──────────────────────────────────────────────────────────────────

function streamPdf(fn: (doc: PDFKit.PDFDocument) => void): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      doc.on("data", (chunk) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      doc.on("end", () => {
        controller.close();
      });
      doc.on("error", (err) => {
        controller.error(err);
      });
      fn(doc);
      doc.end();
    },
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function rupee(amount: number) {
  return `Rs. ${Number(amount).toFixed(2)}`;
}

// ─── route handler ─────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { admin } = await verifyAdmin(request);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await params;

    const db = createServiceClient();

    // Fetch the order with items + nested product names
    const { data: order, error } = await db
      .from("orders")
      .select(
        `
        id,
        created_at,
        customer_name,
        phone,
        address,
        delivery_address,
        total_amount,
        total_price,
        delivery_charge,
        status,
        payment_method,
        payment_status,
        transaction_id,
        user_id,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price,
          variant_label,
          products ( name )
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Resolve delivery address
    const deliveryAddress =
      (order as any).delivery_address || (order as any).address || "N/A";

    // Compute totals
    const items: any[] = (order as any).order_items ?? [];
    const subtotal = items.reduce(
      (sum: number, i: any) =>
        sum + ((i.total_price as number) || i.unit_price * i.quantity),
      0
    );
    const deliveryCharge = Number((order as any).delivery_charge ?? 0);
    const grandTotal =
      Number((order as any).total_amount ?? (order as any).total_price ?? 0) ||
      subtotal + deliveryCharge;

    // ─── PDF layout ──────────────────────────────────────────────────────────────

    const pdfStream = streamPdf((doc: PDFKit.PDFDocument) => {
      const green = "#2E7D32";
      const darkGray = "#1a1a1a";
      const midGray = "#555555";
      const lightGray = "#888888";
      const accentGreen = "#4CAF50";
      const pageWidth = doc.page.width - 100; // left+right margins = 100

      // ── Header bar ────────────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 90).fill(green);
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("MINUTES DELIVERY", 50, 22);
      doc
        .fillColor("rgba(255,255,255,0.75)")
        .font("Helvetica")
        .fontSize(11)
        .text("Order Summary", 50, 50);

      // right-align order id in header
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`ORDER #${(order as any).id}`, 50, 22, {
          align: "right",
          width: pageWidth,
        });

      doc.moveDown(3);

      // ── Info grid ─────────────────────────────────────────────────────────────
      const infoY = 110;
      const col1 = 50;
      const col2 = 230;
      const col3 = 420;

      // Section label helper
      function sectionLabel(x: number, y: number, label: string) {
        doc
          .fillColor(lightGray)
          .font("Helvetica")
          .fontSize(8)
          .text(label.toUpperCase(), x, y);
      }

      function infoValue(
        x: number,
        y: number,
        value: string,
        maxWidth = 160,
        opts: any = {}
      ) {
        doc
          .fillColor(darkGray)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(value, x, y + 12, { width: maxWidth, ...opts });
      }

      // Column 1 – Order details
      sectionLabel(col1, infoY, "Order Date");
      infoValue(col1, infoY, formatDate((order as any).created_at), 160);

      sectionLabel(col1, infoY + 45, "Status");
      doc
        .fillColor(accentGreen)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
          ((order as any).status ?? "pending").toUpperCase(),
          col1,
          infoY + 45 + 12
        );

      // Column 2 – Customer
      sectionLabel(col2, infoY, "Customer");
      infoValue(
        col2,
        infoY,
        (order as any).customer_name || "Guest",
        170
      );

      sectionLabel(col2, infoY + 45, "Phone");
      infoValue(col2, infoY + 45, (order as any).phone || "N/A", 170);

      // Column 3 – Payment
      sectionLabel(col3, infoY, "Payment Method");
      infoValue(
        col3,
        infoY,
        ((order as any).payment_method || "COD").toUpperCase(),
        130
      );

      sectionLabel(col3, infoY + 45, "Payment Status");
      doc
        .fillColor(
          (order as any).payment_status === "paid" ? accentGreen : "#E65100"
        )
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
          ((order as any).payment_status || "pending").toUpperCase(),
          col3,
          infoY + 45 + 12
        );

      // Delivery address (full width)
      const addrY = infoY + 100;
      sectionLabel(col1, addrY, "Delivery Address");
      doc
        .fillColor(midGray)
        .font("Helvetica")
        .fontSize(10)
        .text(deliveryAddress, col1, addrY + 12, { width: pageWidth });

      // ── Divider ───────────────────────────────────────────────────────────────
      const tableTopY = addrY + 50;
      doc
        .moveTo(col1, tableTopY)
        .lineTo(col1 + pageWidth, tableTopY)
        .strokeColor("#e0e0e0")
        .lineWidth(1)
        .stroke();

      // ── Items table ───────────────────────────────────────────────────────────
      const tableHeaderY = tableTopY + 10;
      doc
        .fillColor(lightGray)
        .font("Helvetica")
        .fontSize(8)
        .text("PRODUCT", col1, tableHeaderY)
        .text("QTY", col1 + 280, tableHeaderY, { width: 40, align: "center" })
        .text("UNIT PRICE", col1 + 330, tableHeaderY, {
          width: 80,
          align: "right",
        })
        .text("TOTAL", col1 + 420, tableHeaderY, {
          width: pageWidth - 420,
          align: "right",
        });

      doc
        .moveTo(col1, tableHeaderY + 15)
        .lineTo(col1 + pageWidth, tableHeaderY + 15)
        .strokeColor("#e0e0e0")
        .lineWidth(0.5)
        .stroke();

      let rowY = tableHeaderY + 22;
      const rowHeight = 24;

      items.forEach((item: any, idx: number) => {
        // Zebra stripe
        if (idx % 2 === 0) {
          doc
            .rect(col1 - 4, rowY - 4, pageWidth + 8, rowHeight)
            .fill("#f9f9f9");
        }

        const productName =
          item.product_name ||
          item.products?.name ||
          "Unknown Product";
        const displayName = item.variant_label
          ? `${productName} (${item.variant_label})`
          : productName;
        const lineTotal =
          Number(item.total_price) || item.unit_price * item.quantity;

        doc
          .fillColor(darkGray)
          .font("Helvetica")
          .fontSize(9)
          .text(displayName, col1, rowY, { width: 270 })
          .text(String(item.quantity), col1 + 280, rowY, {
            width: 40,
            align: "center",
          })
          .text(rupee(item.unit_price), col1 + 330, rowY, {
            width: 80,
            align: "right",
          })
          .text(rupee(lineTotal), col1 + 420, rowY, {
            width: pageWidth - 420,
            align: "right",
          });

        rowY += rowHeight;
      });

      // ── Totals summary ────────────────────────────────────────────────────────
      const summaryX = col1 + 300;
      const summaryWidth = pageWidth - 300;
      const summaryY = rowY + 10;

      doc
        .moveTo(col1, summaryY - 5)
        .lineTo(col1 + pageWidth, summaryY - 5)
        .strokeColor("#e0e0e0")
        .lineWidth(1)
        .stroke();

      doc
        .fillColor(midGray)
        .font("Helvetica")
        .fontSize(9)
        .text("Subtotal", summaryX, summaryY)
        .text(rupee(subtotal), summaryX, summaryY, {
          align: "right",
          width: summaryWidth,
        });

      doc
        .fillColor(midGray)
        .fontSize(9)
        .text("Delivery Charge", summaryX, summaryY + 18)
        .text(rupee(deliveryCharge), summaryX, summaryY + 18, {
          align: "right",
          width: summaryWidth,
        });

      // Grand total box
      const gtY = summaryY + 42;
      doc.rect(summaryX - 6, gtY - 6, summaryWidth + 12, 30).fill(green);

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Grand Total", summaryX, gtY + 3)
        .text(rupee(grandTotal), summaryX, gtY + 3, {
          align: "right",
          width: summaryWidth,
        });

      // ── Footer ────────────────────────────────────────────────────────────────
      const footerY = doc.page.height - 60;
      doc
        .moveTo(50, footerY - 10)
        .lineTo(doc.page.width - 50, footerY - 10)
        .strokeColor("#e0e0e0")
        .lineWidth(0.5)
        .stroke();

      doc
        .fillColor(lightGray)
        .font("Helvetica")
        .fontSize(9)
        .text("Thank you for your order! We appreciate your business.", 50, footerY, {
          align: "center",
          width: doc.page.width - 100,
        });
    });

    // ─── Stream response ──────────────────────────────────────────────────────
    return new Response(pdfStream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order_${orderId}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF Route Error:", err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
