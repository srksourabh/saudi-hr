"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function authenticate(credentials: { email: string; password: string }, isDemo = false) {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      setError(
        isDemo
          ? "Demo access is temporarily unavailable. Please try again."
          : "بيانات الدخول غير صحيحة",
      );
    } catch {
      setError(
        isDemo
          ? "Demo access is temporarily unavailable. Please try again."
          : "حدث خطأ ما. حاول مرة أخرى",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await authenticate({ email, password });
  }

  async function handleDemoLogin() {
    const demoCredentials = { email: "admin@demo.com", password: "Demo@1234" };
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    await authenticate(demoCredentials, true);
  }

  return (
    <div className="saudi-glass w-full max-w-md rounded-xl border-0 shadow-2xl">
      <div className="p-6 pb-2 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--saudi-green))] to-[hsl(var(--saudi-green-dark))] shadow-lg">
          <span className="text-2xl font-bold text-white">U</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to your UDS-HR account</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-6 pt-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[hsl(var(--saudi-rose))]/30 bg-[hsl(var(--saudi-rose))]/10 px-4 py-3 text-sm text-[hsl(var(--saudi-rose))]"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.sa"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="saudi-gradient-primary inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-base font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="relative flex w-full items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs font-medium uppercase tracking-wider text-slate-400">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="saudi-badge-premium inline-flex h-11 w-full items-center justify-center rounded-md border px-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mr-2">★</span>
            {loading ? "Opening demo..." : "Try the demo (one click)"}
          </button>

          <div className="pt-1 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-[hsl(var(--saudi-green))] hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
