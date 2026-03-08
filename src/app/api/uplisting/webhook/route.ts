import { NextResponse } from "next/server";
import { verifyWebhookSignature, isConfigured } from "@/lib/uplisting";

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ received: true, devMode: true });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("x-uplisting-signature") || "";

    if (process.env.UPLISTING_WEBHOOK_SECRET) {
      const valid = verifyWebhookSignature(body, signature);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("[uplisting webhook] Event received:", event.type || "unknown");

    // Log for now — database integration in Phase 4
    switch (event.type) {
      case "booking.created":
        console.log("[uplisting webhook] Booking created:", event.data);
        break;
      case "booking.updated":
        console.log("[uplisting webhook] Booking updated:", event.data);
        break;
      case "booking.cancelled":
        console.log("[uplisting webhook] Booking cancelled:", event.data);
        break;
      default:
        console.log("[uplisting webhook] Unhandled:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[api/uplisting/webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
