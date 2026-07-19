import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { createHash } from "crypto";
import { adminDb, users, verificationTokens } from "@hrms-app/db";
import { and, eq, sql } from "drizzle-orm";
import { resetPasswordSchema } from "@hrms-app/validators";

function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

const INVALID = "This reset link is invalid or has expired. Please request a new one.";

/**
 * POST /api/auth/reset  (C1)
 * Verifies the hashed token, enforces the password policy, blocks reuse of the
 * current password, updates the hash, consumes the token, and clears lockout.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: first }, { status: 400 });
  }
  const { email, token, password } = parsed.data;

  try {
    const record = await adminDb.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, hashResetToken(token)),
      ),
    });
    if (!record || record.expires < new Date()) {
      return NextResponse.json({ error: INVALID }, { status: 400 });
    }

    const user = await adminDb.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      return NextResponse.json({ error: INVALID }, { status: 400 });
    }

    if (user.passwordHash && (await compare(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Your new password must be different from your current password." },
        { status: 400 },
      );
    }

    const passwordHash = await hash(password, 12);
    await adminDb.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    await adminDb.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    try {
      await adminDb.execute(sql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ${user.id}`);
    } catch {
      /* lockout columns not migrated — ignore */
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth] reset error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
