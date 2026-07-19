"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Globe2,
  Loader2,
  Search,
  ShieldCheck,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";

/**
 * Super-admin landing for Taāzur (the platform operator).
 *
 * Lists every tenant that has signed up through /signup, with deep links
 * to their data plus a "Copy signup link" CTA so the platform team can
 * share a personalised invite with a prospective customer.
 *
 * In a multi-tenant deployment this would sit behind a separate
 * platform-admin role; for the customer demo it is open to any
 * super_admin session.
 */
export default function SuperAdminPage() {
  const session = api.auth.session.useQuery();
  const list = api.auth.tenantsList.useQuery(undefined, {
    retry: false,
  });

  const [search, setSearch] = useState("");
  const [_openTenant, setOpenTenant] = useState<string | null>(null);

  if (session.isLoading || list.isLoading) {
    return (
      <div className="flex items-center gap-2 p-12 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading tenants…
      </div>
    );
  }

  if (list.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="mt-2 text-lg font-semibold">Cannot read tenant list</h2>
        <p className="mt-1 text-sm">{list.error.message}</p>
        <p className="mt-3 text-xs text-rose-700">
          Only platform operators with super_admin on the system tenant
          can see this page. Sign in with the TaazurAdmin@2026 demo
          credentials or via the /super-admin login below.
        </p>
      </div>
    );
  }

  const data = list.data as { tenants: any[]; users: any[] } | undefined;
  const tenants = data?.tenants ?? [];
  const recentUsers = data?.users ?? [];

  const filtered = tenants.filter((t) =>
    !search.trim() ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.crNumber ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: tenants.length,
    today: tenants.filter((t) => {
      const created = new Date(t.createdAt);
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return created.getTime() > dayAgo;
    }).length,
    users: recentUsers.length,
    proTenants: tenants.filter((t) => t.planTier === "enterprise" || t.planTier === "professional").length,
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 px-6 py-7 text-white sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Taāzur · Platform admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Tenants & onboarding</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
              Every new company that signs up at <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">/signup</code> appears here. Each tenant gets an isolated schema, a
              super_admin user, and is ready to seed their first employees.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Open public signup <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total tenants" value={stats.total} icon={Building2} />
          <Stat label="Signed up in last 24h" value={stats.today} icon={CalendarClock} />
          <Stat label="Pro / enterprise tenants" value={stats.proTenants} icon={ShieldCheck} />
          <Stat label="Users in registry" value={stats.users} icon={Users} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 p-1.5 w-fit">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow ring-1 ring-slate-200">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name, CR, schema"
            className="w-56 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="rounded-full p-0.5 text-slate-400 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No tenants yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              When a new company signs up at /signup, they appear here within seconds.
            </p>
            <Link href="/signup" className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900">
              Open public signup <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">CR</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">
                      {t.regulatoryContext} · {t.nitaqatActivity || "no Nitaqat activity yet"}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{t.crNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      t.planTier === "enterprise" ? "bg-emerald-100 text-emerald-800"
                      : t.planTier === "professional" ? "bg-sky-100 text-sky-800"
                      : "bg-slate-100 text-slate-700"
                    }`}>
                      <CheckCircle2 className="h-2.5 w-2.5" /> {t.planTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href="/super-admin"
                        onClick={() => setOpenTenant(t.id)}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        href={`mailto:${t.id}@taazur.example`}
                        className="text-xs font-semibold text-slate-500 hover:underline"
                      >
                        Email
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">Recent user registrations</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recentUsers.slice(0, 9).map((u: any) => (
            <div key={u.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{u.name || "—"}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                <span className="rounded-full bg-white px-1.5 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">{u.role}</span>
                <span className="text-slate-400">tenant {u.tenantId?.slice(0, 6) ?? "—"}…</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-slate-400">
        <Globe2 className="mr-1 inline h-3 w-3" />
        Each tenant schema is isolated. The platform operator (Taāzur) can read this metadata; tenant data is not exposed across companies.
      </p>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-400/30">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-white/60">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}