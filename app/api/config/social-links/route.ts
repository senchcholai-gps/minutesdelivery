import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    facebook: "https://www.facebook.com/share/16qvqvN8DL/",
    instagram: "https://www.instagram.com/minutesdeliveryudt?igsh=MWEybXdjanFkNHd2Mw==",
    whatsapp: "https://wa.me/919363737641"
  })
}
