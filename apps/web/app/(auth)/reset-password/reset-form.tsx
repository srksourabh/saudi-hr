"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const inputClass =
  "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const missingLink = !email || !token;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h1 className="text-lg font-semibold text-slate-900">Set a new password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a strong password: at least 8 characters with upper- and lower-case letters, a
            number, and a special character.
          </p>
        </div>

        {missingLink ? (
          <div className="px-6 py-6">
            <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This reset link is incomplete. Please request a new one.
            </p>
            <a href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--saudi-green))] hover:underline">
              Request a reset link
            </a>
          </div>
        ) : done ? (
          <div className="px-6 py-6">
            <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Your password has been updated. You can now sign in.
            </p>
            <a href="/login" className="mt-4 inline-block text-sm font-semibold text-[hsl(var(--saudi-green))] hover:underline">
              Go to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[hsl(var(--saudi-green))] px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
