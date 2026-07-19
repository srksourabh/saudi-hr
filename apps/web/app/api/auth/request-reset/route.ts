import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { adminDb, users, verificationTokens } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { requestPasswordResetSchema } from "@hrms-app/validators";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * POST /api/auth/request-reset  (C1 / AUTH-002)
 * Generates a single-use, time-limited reset token, stores only its hash, and
 * (in production) emails the link. Always returns { ok: true } — it never
 * reveals whether an email is registered.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = requestPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  const email = parsed.data.email;

  try {
    const user = await adminDb.query.users.findFirst({ where: eq(users.email, email) });
    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await adminDb.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
      await adminDb.insert(verificationTokens).values({
        identifier: email,
        token: hashResetToken(rawToken),
        expires,
      });
      const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
      const resetUrl = `${base}/reset-password?email=${encodeURIComponent(email)}&token=${rawToken}`;
      // TODO(email): deliver via @hrms-app/email. Logged until wired so the flow
      // is testable without sending mail to real recipients.
      console.info("[auth] password reset link generated for", email, resetUrl);
    }
  } catch (err) {
    console.error("[auth] request-reset error", err);
    // Still return ok to avoid leaking state; the user can retry.
  }

  return NextResponse.json({ ok: true });
}
