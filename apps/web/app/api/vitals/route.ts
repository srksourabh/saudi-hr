import { NextResponse } from "next/server";

export const runtime = "nodejs";

type VitalPayload = {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType?: string;
  path?: string;
};

const ALLOWED_NAMES = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

export async function POST(request: Request) {
  let payload: VitalPayload;
  try {
    payload = (await request.json()) as VitalPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!ALLOWED_NAMES.has(payload.name)) {
    return NextResponse.json({ ok: false, error: "unknown metric" }, { status: 400 });
  }

  if (payload.rating === "poor") {
    console.warn("[vitals][poor]", payload.name, payload.value.toFixed(2), payload.path ?? "");
  } else {
    console.log("[vitals]", payload.name, payload.value.toFixed(2), payload.rating, payload.path ?? "");
  }

  return NextResponse.json({ ok: true });
}