import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 })
    }

    const { SMTP_EMAIL, SMTP_PASSWORD } = process.env

    if (!SMTP_EMAIL || !SMTP_PASSWORD) {
      console.error("[Contact] SMTP credentials not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"${name}" <${SMTP_EMAIL}>`,
      to: "minutesdeliverysm@gmail.com",
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #e53e3e;">New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p style="background: #f7f7f7; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 0.85em; color: #999;">Sent via Minutes Delivery contact form</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Contact] Email send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
