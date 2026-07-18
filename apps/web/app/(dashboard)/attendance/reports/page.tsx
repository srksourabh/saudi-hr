"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Crown,
  MapPin,
  Users,
  Clock,
  Search,
  RefreshCw,
} from "lucide-react";
import type { TreeNode } from "~/trpc/routers/attendance";
import { Badge } from "@hrms-app/ui";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800",
  late: "bg-amber-100 text-amber-800",
  absent: "bg-red-100 text-red-800",
  on_leave: "bg-blue-100 text-blue-800",
  remote: "bg-purple-100 text-purple-800",
  half_day: "bg-orange-100 text-orange-800",
};

const STATUS_LABELS: Record<string, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  on_leave: "On Leave",
  remote: "Remote",
  half_day: "Half Day",
};

interface PersonCardProps {
  node: TreeNode;
  depth?: number;
  selectedDate: string;
}

function PersonCard({ node, depth = 0, selectedDate }: PersonCardProps) {
  const [open, setOpen] = useState(depth === 0);
  const hasReports = node.children.length > 0;
  const isExec = depth === 0;

  const { data: todayRecords } = api.attendance.today.useQuery(
    { employeeId: node.id } as any,
    { enabled: !!node.id }
  );
  const latestRecord = todayRecords?.records?.[todayRecords.records.length - 1];

  const initials = node.fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const status = latestRecord?.status ?? "present";
  const statusClass = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="space-y-3">
      <div
        className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md ${
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
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">{node.fullName}</h3>
              {isExec && <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Top of chain" />}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass}`}>
                {STATUS_LABELS[status] ?? status}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {node.department && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {node.department}
                </span>
              )}
              {latestRecord?.punchInAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(latestRecord.punchInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  {latestRecord.punchOutAt &&
                    ` → ${new Date(latestRecord.punchOutAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              )}
              {latestRecord?.workLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {latestRecord.workLocation.split(",").length === 2 ? "Location set" : latestRecord.workLocation}
                </span>
              )}
              {node.lastLocation && !latestRecord?.workLocation && (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <MapPin className="h-3 w-3" /> Last known: {node.lastLocation.workLocation ?? "Unknown"}
                </span>
              )}
            </div>

            {latestRecord?.punchSequence && latestRecord.punchSequence > 1 && (
              <div className="mt-1">
                <Badge variant="outline" className="text-[10px]">
                  Punch #{latestRecord.punchSequence}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/employees/${node.id}`}
              className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 sm:flex"
            >
              Profile
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
        <div className="relative space-y-3 border-s-2 border-dashed border-slate-200 ps-6">
          {node.children.map((child) => (
            <PersonCard key={child.id} node={child} depth={depth + 1} selectedDate={selectedDate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AttendanceReportsPage() {
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allEmployees } = api.employee.list.useQuery({ status: undefined, pageSize: 500 } as any);

  const managers = allEmployees?.filter(
    (e: any) => e.employmentStatus === "active" && e.directReports && (e as any).directReports?.length > 0
  ) ?? [];

  const rootEmployeeId = selectedManagerId ?? managers[0]?.id ?? null;

  const { data: subtree, isLoading, refetch } = api.attendance.getSubtree.useQuery(
    { rootEmployeeId: rootEmployeeId! } as any,
    { enabled: !!rootEmployeeId }
  );

  const { data: todayAll } = api.attendance.today.useQuery({} as any);

  const todayByEmployee = new Map<string, any>();
  for (const rec of todayAll?.records ?? []) {
    const existing = todayByEmployee.get(rec.employeeId);
    if (!existing ||
      rec.workDate > existing.workDate ||
      (rec.workDate === existing.workDate && rec.punchSequence > existing.punchSequence)) {
      todayByEmployee.set(rec.employeeId, rec);
    }
  }

  const countTree = (node: TreeNode): number =>
    1 + node.children.reduce((s, c) => s + countTree(c), 0);

  const totalInTree = subtree ? countTree(subtree) : 0;
  const presentCount = subtree
    ? (function countPresent(n: TreeNode): number {
        const today = todayByEmployee.get(n.id);
        const hasPunchIn = !!today?.punchInAt;
        return (hasPunchIn ? 1 : 0) + n.children.reduce((s, c) => s + countPresent(c), 0);
      })(subtree)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white px-6 py-7 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Attendance Intelligence</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Team Reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Organizational visibility with live attendance and last known locations. Select any manager to explore their reporting tree.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">In subtree</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{totalInTree}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">Punched in today</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-700">{presentCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Managers available</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{managers.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Status</p>
            <p className="mt-1 text-sm font-semibold tracking-tight text-slate-950">
              {selectedManagerId ? "Filtered" : "All"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <select
          value={rootEmployeeId ?? ""}
          onChange={(e) => setSelectedManagerId(e.target.value || null)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">— Select manager —</option>
          {managers.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.department?.name ?? "No dept"})
            </option>
          ))}
        </select>

        <button
          onClick={() => void refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tree */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">Loading team tree...</p>
          </div>
        ) : !subtree ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No tree data</h3>
            <p className="mt-1 text-sm text-slate-500">
              Select a manager above to view their reporting tree.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <PersonCard node={subtree} depth={0} selectedDate={new Date().toISOString().slice(0, 10)} />
          </div>
        )}
      </section>
    </div>
  );
}
