import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Full-payload validation (API-013): value must be a finite number and path is
// bounded, so a malformed beacon can neither crash the handler nor inject
// content into logs. Intentionally unauthenticated — it is a browser beacon.
const vitalSchema = z.object({
  name: z.enum(["LCP", "INP", "CLS", "FCP", "TTFB"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  id: z.string().max(128),
  navigationType: z.string().max(64).optional(),
  path: z.string().max(512).optional(),
});

/** Strip control characters (CR/LF etc.) so a crafted path can't forge log lines. */
function sanitizeForLog(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, "");
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = vitalSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }
  const payload = parsed.data;
  const path = payload.path ? sanitizeForLog(payload.path) : "";

  if (payload.rating === "poor") {
    console.warn("[vitals][poor]", payload.name, payload.value.toFixed(2), path);
  } else {
    console.log("[vitals]", payload.name, payload.value.toFixed(2), payload.rating, path);
  }

  return NextResponse.json({ ok: true });
}
