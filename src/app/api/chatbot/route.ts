import { NextResponse } from "next/server";
import { processMessage } from "@/lib/chatbot";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId: incomingSessionId, message } = body;

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message must be a non-empty string" },
        { status: 400 },
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message must be 500 characters or fewer" },
        { status: 400 },
      );
    }

    const sessionId =
      typeof incomingSessionId === "string" && incomingSessionId.trim().length > 0
        ? incomingSessionId
        : randomUUID();

    const result = await processMessage(sessionId, message.trim());

    return NextResponse.json({
      sessionId,
      response: result.response,
      intent: result.intent,
    });
  } catch (error) {
    console.error("[chatbot] Error processing message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
