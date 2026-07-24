"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import {
  ArrowUpRight,
  Building2,
  Crown,
  GitBranch,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

interface EmployeeNode {
  id: string;
  fullName: string;
  nationality: string | null;
  employmentStatus: string | null;
  managerEmployeeId: string | null;
  department: { id: string; name: string } | null;
  designation: { id: string; title: string } | null;
  reports: EmployeeNode[];
}

interface PositionedNode {
  node: EmployeeNode;
  x: number;
  y: number;
  depth: number;
}

interface OrgEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const CARD_WIDTH = 270;
const CARD_HEIGHT = 136;
const GAP_X = 46;
const GAP_Y = 92;
const PAD = 40;

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  on_leave: "bg-amber-100 text-amber-800",
  terminated: "bg-slate-100 text-slate-600",
  suspended: "bg-rose-100 text-rose-800",
};

const DEPARTMENT_COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#c2410c",
  "#be123c",
  "#0369a1",
  "#4d7c0f",
  "#a16207",
];

function buildOrgTree(employees: any[]): EmployeeNode[] {
  const byId = new Map<string, EmployeeNode>();
  for (const employee of employees) {
    byId.set(employee.id, {
      id: employee.id,
      fullName: employee.fullName,
      nationality: employee.nationality,
      employmentStatus: employee.employmentStatus,
      managerEmployeeId: employee.managerEmployeeId,
      department: employee.department ?? null,
      designation: employee.designation ?? null,
      reports: [],
    });
  }

  const attached = new Set<string>();
  const roots: EmployeeNode[] = [];
  for (const employee of employees) {
    const node = byId.get(employee.id);
    if (!node) continue;

    const managerId = employee.managerEmployeeId;
    const manager = managerId && managerId !== employee.id ? byId.get(managerId) : null;
    if (manager) {
      manager.reports.push(node);
      attached.add(node.id);
    } else {
      roots.push(node);
    }
  }

  if (roots.length === 0) {
    for (const employee of employees) {
      const node = byId.get(employee.id);
      if (node) roots.push(node);
    }
  } else {
    for (const employee of employees) {
      const node = byId.get(employee.id);
      if (node && !attached.has(node.id) && !roots.some((root) => root.id === node.id)) {
        roots.push(node);
      }
    }
  }

  const sortRec = (node: EmployeeNode, path = new Set<string>()) => {
    if (path.has(node.id)) {
      node.reports = [];
      return;
    }
    const next = new Set(path);
    next.add(node.id);
    node.reports.sort((a, b) => a.fullName.localeCompare(b.fullName));
    node.reports.forEach((child) => sortRec(child, next));
  };

  roots.sort((a, b) => a.fullName.localeCompare(b.fullName));
  roots.forEach((root) => sortRec(root));
  return roots;
}

function createOrgLayout(roots: EmployeeNode[]) {
  let cursor = 0;
  const nodes: PositionedNode[] = [];
  const edges: OrgEdge[] = [];

  const walk = (node: EmployeeNode, depth: number, path = new Set<string>()): PositionedNode => {
    const isCycle = path.has(node.id);
    const next = new Set(path);
    next.add(node.id);
    const children = isCycle ? [] : node.reports;

    let x: number;
    if (children.length === 0) {
      x = PAD + cursor * (CARD_WIDTH + GAP_X);
      cursor += 1;
    } else {
      const childPositions = children.map((child) => walk(child, depth + 1, next));
      const first = childPositions[0]!;
      const last = childPositions[childPositions.length - 1]!;
      x = (first.x + last.x) / 2;

      for (const child of childPositions) {
        edges.push({
          id: `${node.id}-${child.node.id}`,
          fromX: x + CARD_WIDTH / 2,
          fromY: PAD + depth * (CARD_HEIGHT + GAP_Y) + CARD_HEIGHT,
          toX: child.x + CARD_WIDTH / 2,
          toY: child.y,
        });
      }
    }

    const positioned = {
      node,
      x,
      y: PAD + depth * (CARD_HEIGHT + GAP_Y),
      depth,
    };
    nodes.push(positioned);
    return positioned;
  };

  roots.forEach((root) => walk(root, 0));

  const maxX = nodes.reduce((max, item) => Math.max(max, item.x), 0);
  const maxY = nodes.reduce((max, item) => Math.max(max, item.y), 0);
  return {
    nodes,
    edges,
    width: Math.max(900, maxX + CARD_WIDTH + PAD),
    height: Math.max(560, maxY + CARD_HEIGHT + PAD),
  };
}

function countReports(node: EmployeeNode): number {
  return node.reports.reduce((sum, child) => sum + 1 + countReports(child), 0);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function OrgCard({
  item,
  selfId,
  canOpenProfile,
  departmentColor,
  search,
}: {
  item: PositionedNode;
  selfId: string | null;
  canOpenProfile: boolean;
  departmentColor: string;
  search: string;
}) {
  const { node } = item;
  const isSelf = node.id === selfId;
  const isExecutive = item.depth === 0;
  const searchMatch = search.trim().length > 0 && node.fullName.toLowerCase().includes(search.trim().toLowerCase());
  const isSaudi = node.nationality?.toLowerCase() === "saudi" || node.nationality?.toLowerCase() === "saudi arabia";

  return (
    <div
      className={`absolute rounded-lg border bg-white shadow-sm transition ${
        isSelf ? "border-emerald-500 ring-2 ring-emerald-200" : searchMatch ? "border-sky-500 ring-2 ring-sky-200" : "border-slate-200"
      }`}
      style={{
        left: item.x,
        top: item.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderTopWidth: 4,
        borderTopColor: departmentColor,
      }}
    >
      <div className="flex h-full flex-col p-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
              isExecutive ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-800"
            }`}
          >
            {initials(node.fullName) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-slate-950">{node.fullName}</h3>
              {isExecutive && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">{node.designation?.title ?? "Designation not set"}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{node.department?.name ?? "Unassigned"}</span>
          </span>
          {node.employmentStatus && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_BADGE[node.employmentStatus] ?? "bg-slate-100 text-slate-600"}`}>
              {node.employmentStatus.replace("_", " ")}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isSaudi ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-800"}`}>
            {isSaudi ? "Saudi" : "Expat"}
          </span>
          {isSelf && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">You</span>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {node.reports.length} direct
          </span>
          {canOpenProfile ? (
            <Link href={`/employees/${node.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100">
              Profile <ArrowUpRight className="h-3 w-3" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Org
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrganogramPage() {
  const { data: session } = useSession();
  const [zoom, setZoom] = useState(0.8);
  const [search, setSearch] = useState("");

  const orgChart = api.employee.orgChart.useQuery();
  const people = orgChart.data ?? [];
  const selfId = session?.user?.employeeId ?? null;
  const canOpenProfile = session?.user?.role !== "employee";

  const tree = useMemo(() => buildOrgTree(people), [people]);
  const layout = useMemo(() => createOrgLayout(tree), [tree]);
  const totalReportingLines = useMemo(() => tree.reduce((sum, root) => sum + countReports(root), 0), [tree]);

  const departmentNames = useMemo<string[]>(() => {
    const names = people.map((person: any) => String(person.department?.name ?? "Unassigned"));
    return Array.from(new Set<string>(names)).sort();
  }, [people]);

  const departmentColor = useMemo(() => {
    const colors = new Map<string, string>();
    departmentNames.forEach((name, index) => {
      colors.set(name, DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]!);
    });
    return colors;
  }, [departmentNames]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const person of people as any[]) {
      const status = person.employmentStatus ?? "unknown";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [people]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">People & Organization</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">Organization Architecture</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Complete reporting structure across the company. Reporting lines drive attendance corrections, expenses, leave, goals and onboarding.
            </p>
          </div>
          {canOpenProfile && (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/employees" className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Users className="h-4 w-4" /> People directory
              </Link>
              <Link href="/employees/new" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900">
                Add employee <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="People" value={String(people.length)} />
          <Stat label="Top positions" value={String(tree.length)} />
          <Stat label="Reporting lines" value={String(totalReportingLines)} />
          <Stat label="Departments" value={String(departmentNames.length)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusCounts.map(([status, count]) => (
            <span key={status} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
              <strong className="text-slate-900">{count}</strong>
              <span className="capitalize text-slate-500">{status.replace("_", " ")}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              title="Zoom out"
              onClick={() => setZoom((value) => Math.max(0.45, Number((value - 0.1).toFixed(2))))}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-xs font-semibold tabular-nums text-slate-600">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              title="Zoom in"
              onClick={() => setZoom((value) => Math.min(1.25, Number((value + 0.1).toFixed(2))))}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Fit"
              onClick={() => setZoom(0.65)}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Reset"
              onClick={() => setZoom(0.8)}
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {orgChart.isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading organogram...</div>
        ) : layout.nodes.length === 0 ? (
          <div className="py-16 text-center">
            <GitBranch className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No organization structure yet</h3>
            <p className="mt-1 text-sm text-slate-500">Add employees and assign reporting managers.</p>
            {canOpenProfile && (
              <Link
                href="/employees/new"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Add first employee <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="h-[68vh] min-h-[560px] overflow-auto bg-slate-50">
            <div
              className="relative"
              style={{
                width: layout.width * zoom,
                height: layout.height * zoom,
              }}
            >
              <div
                className="absolute left-0 top-0"
                style={{
                  width: layout.width,
                  height: layout.height,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
                  <defs>
                    <pattern id="org-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width={layout.width} height={layout.height} fill="url(#org-grid)" />
                  {layout.edges.map((edge) => {
                    const midY = edge.fromY + (edge.toY - edge.fromY) / 2;
                    return (
                      <path
                        key={edge.id}
                        d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>

                {layout.nodes.map((item) => {
                  const deptName = item.node.department?.name ?? "Unassigned";
                  return (
                    <OrgCard
                      key={item.node.id}
                      item={item}
                      selfId={selfId}
                      canOpenProfile={canOpenProfile}
                      departmentColor={departmentColor.get(deptName) ?? DEPARTMENT_COLORS[0]!}
                      search={search}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
