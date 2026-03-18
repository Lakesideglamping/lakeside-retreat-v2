import { NextResponse } from "next/server";

const API_BASE = "https://connect.uplisting.io";

const PROPERTY_IDS: Record<string, string | undefined> = {
  "dome-pinot": process.env.UPLISTING_PINOT_ID,
  "dome-rose": process.env.UPLISTING_ROSE_ID,
  "lakeside-cottage": process.env.UPLISTING_COTTAGE_ID,
};

function authHeader(): string {
  const key = process.env.UPLISTING_API_KEY;
  if (!key) return "";
  return `Basic ${Buffer.from(key).toString("base64")}`;
}

// POST: block or unblock dates, optionally with a note
export async function POST(request: Request) {
  const { accommodation, from, to, available = true, note } = await request.json();

  const propertyId = PROPERTY_IDS[accommodation];
  if (!propertyId) {
    return NextResponse.json({ error: "Unknown accommodation" }, { status: 400 });
  }

  const day: Record<string, unknown> = { available, from, to };
  if (note) day.note = note;

  const res = await fetch(`${API_BASE}/calendar/${propertyId}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ calendar: { days: [day] } }),
  });

  const body = await res.text();
  if (!res.ok) {
    return NextResponse.json({ error: body, status: res.status }, { status: 500 });
  }

  return NextResponse.json({ success: true, accommodation, from, to, available, note });
}
