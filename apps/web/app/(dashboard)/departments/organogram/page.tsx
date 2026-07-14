"use client";

import { useMemo } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ArrowUpRight, Building2, ChevronDown, ChevronRight, Crown, Users } from "lucide-react";
import { useState } from "react";

interface EmployeeNode {
  id: string;
  fullName: string;
  jobTitle: string | null;
  nationality: string | null;
  employmentStatus: string | null;
  managerEmployeeId: string | null;
  department: { id: string; name: string } | null;
  photoUrl?: string | null;
  reports: EmployeeNode[];
}

function buildOrgTree(employees: any[]): EmployeeNode[] {
  const byId = new Map<string, EmployeeNode>();
  for (const e of employees) {
    byId.set(e.id, {
      id: e.id,
      fullName: e.fullName,
      jobTitle: e.jobTitle,
      nationality: e.nationality,
      employmentStatus: e.employmentStatus,
      managerEmployeeId: e.managerEmployeeId,
      department: e.department,
      photoUrl: e.photoUrl,
      reports: [],
    });
  }
  const roots: EmployeeNode[] = [];
  for (const e of employees) {
    const node = byId.get(e.id)!;
    if (e.managerEmployeeId && byId.has(e.managerEmployeeId)) {
      byId.get(e.managerEmployeeId)!.reports.push(node);
    } else {
      roots.push(node);
    }
  }
  // Sort by name for stable rendering.
  const sortRec = (n: EmployeeNode) => {
    n.reports.sort((a, b) => a.fullName.localeCompare(b.fullName));
    n.reports.forEach(sortRec);
  };
  roots.forEach(sortRec);
  return roots;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  on_leave: "bg-amber-100 text-amber-800",
  terminated: "bg-slate-100 text-slate-600",
  suspended: "bg-rose-100 text-rose-800",
};

function PersonCard({ node, depth = 0 }: { node: EmployeeNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasReports = node.reports.length > 0;
  const isExec = depth === 0;
  const initials = node.fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-3">
      <div
        className={`group relative rounded-2xl border bg-white p-4 shadow-[0_2px_6px_-2px_rgba(15,23,42,.06)] transition hover:border-emerald-300 hover:shadow-[0_8px_20px_-12px_rgba(15,23,42,.18)] ${
          isExec ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
              isExec ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {initials || "—"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">{node.fullName}</h3>
              {isExec && <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Top of chain" />}
              {node.employmentStatus && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE[node.employmentStatus] ?? "bg-slate-100 text-slate-600"}`}>
                  {node.employmentStatus.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">{node.jobTitle ?? "—"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              {node.department && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">
                  <Building2 className="h-3 w-3" /> {node.department.name}
                </span>
              )}
              {node.nationality && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200 capitalize">
                  {node.nationality}
                </span>
              )}
              {hasReports && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 ring-1 ring-emerald-200 text-emerald-800">
                  <Users className="h-3 w-3" /> {node.reports.length} direct report{node.reports.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/employees/${node.id}`}
              className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 sm:flex"
            >
              Profile <ArrowUpRight className="h-3 w-3" />
            </Link>
            {hasReports && (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Collapse reports" : "Expand reports"}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasReports && open && (
        <div className="relative ms-6 space-y-3 border-s-2 border-dashed border-slate-200 ps-6">
          {node.reports.map((r) => (
            <PersonCard key={r.id} node={r} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganogramPage() {
  const employees = api.employee.list.useQuery({ pageSize: 200 });
  const departments = api.department.list.useQuery();

  const tree = useMemo(() => buildOrgTree(employees.data ?? []), [employees.data]);
  const orphans = useMemo(() => (employees.data ?? []).filter((e: any) => !e.managerEmployeeId), [employees.data ?? employees.isLoading]);
  const totalReports = useMemo(() => {
    const count = (n: EmployeeNode): number => n.reports.reduce((s, c) => s + 1 + count(c), 0);
    return tree.reduce((s, r) => s + r.reports.length + count(r), 0);
  }, [tree]);
  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees.data ?? []) {
      const k = e.department?.name ?? "Unassigned";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [employees.data]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white px-6 py-7 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">People & Organization</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Organogram</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              The chain of command across the company. Reporting lines drive approvals for
              expenses, leave, goals and onboarding. Updates here cascade into every workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/employees" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Users className="h-4 w-4" /> People directory
            </Link>
            <Link href="/employees/new" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900">
              Add employee <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total people" value={String(employees.data?.length ?? 0)} />
          <Stat label="Top of chain" value={String(tree.length)} />
          <Stat label="Reporting lines" value={String(totalReports)} />
          <Stat label="Departments" value={String((departments.data ?? []).length)} />
        </div>

        {byDept.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">By department</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {byDept.map(([name, count]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
                >
                  <Building2 className="h-3 w-3 text-slate-500" />
                  <strong className="text-slate-900">{count}</strong>
                  <span className="text-slate-500">{name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Tree */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        {employees.isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading organogram…</div>
        ) : tree.length === 0 ? (
          <div className="py-12 text-center">
            <Crown className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No reporting lines yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add employees with a manager to build the organogram.
            </p>
            <Link
              href="/employees/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Add first employee <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tree.map((root) => (
              <PersonCard key={root.id} node={root} depth={0} />
            ))}
          </div>
        )}

        {orphans.length > 0 && orphans.length !== (employees.data?.length ?? 0) && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>{orphans.length} people</strong> are at the top of their chain (no manager assigned).
            <div className="mt-2 flex flex-wrap gap-1.5">
              {orphans.slice(0, 6).map((e: any) => (
                <Link key={e.id} href={`/employees/${e.id}`} className="rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-amber-200 hover:ring-amber-400">
                  {e.fullName}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}