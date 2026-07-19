"use client";

import { useState } from "react";

const inputClass =
  "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h1 className="text-lg font-semibold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="px-6 py-6">
            <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              If an account exists for <span className="font-medium">{email}</span>, a password reset
              link has been sent. The link expires in one hour.
            </p>
            <a href="/login" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--saudi-green))] hover:underline">
              Back to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="px-6 py-6">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={`mt-2 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[hsl(var(--saudi-green))] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <a href="/login" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--saudi-green))] hover:underline">
              Back to sign in
            </a>
          </form>
        )}
      </div>
    </main>
  );
}
