import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-form";

// The reset link carries a single-use token in the query string; suppress the
// Referer header so the token can never leak on outbound navigation (AUTH-010).
export const metadata: Metadata = { referrer: "no-referrer" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
