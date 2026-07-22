"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Badge } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { LocationPicker, type LocationPickerValue } from "~/components/location-picker";
import {
  Clock, MapPin, LogIn, LogOut, AlertTriangle, CalendarDays, ReceiptText,
  UserRoundCheck, FileBadge, ArrowUpRight, Target,
} from "lucide-react";

const statusBadge: Record<string, string> = {
  present: "bg-green-100 text-green-800 border-green-200",
  late: "bg-amber-100 text-amber-800 border-amber-200",
  remote: "bg-violet-100 text-violet-800 border-violet-200",
  half_day: "bg-orange-100 text-orange-800 border-orange-200",
  on_leave: "bg-blue-100 text-blue-800 border-blue-200",
  absent: "bg-red-100 text-red-800 border-red-200",
};

function fmtMinutes(min: number): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtTime(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface DayRecord {
  id: string;
  status: string;
  workDate: string;
  punchInAt: string | Date | null;
  punchOutAt: string | Date | null;
  workedMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  punchInLat: number | null;
  punchInLng: number | null;
  punchInAccuracy: number | null;
  workLocation: string | null;
}

function toMs(v: string | Date | null | undefined): number | null {
  if (!v) return null;
  const t = typeof v === "string" ? new Date(v).getTime() : v.getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Working hours for a set of same-day records = span from the FIRST punch-in to
 * the LAST punch-out (an open, not-yet-punched-out sequence counts up to now).
 * This matches the agreed rule: multiple punches in a day, first-in to last-out.
 */
function spanMinutes(recs: DayRecord[], nowMs: number): number {
  let firstIn: number | null = null;
  let lastOut: number | null = null;
  let anyOpen = false;
  for (const r of recs) {
    const inMs = toMs(r.punchInAt);
    if (inMs == null) continue;
    firstIn = firstIn == null ? inMs : Math.min(firstIn, inMs);
    const outMs = toMs(r.punchOutAt);
    if (outMs == null) anyOpen = true;
    else lastOut = lastOut == null ? outMs : Math.max(lastOut, outMs);
  }
  if (firstIn == null) return 0;
  const end = anyOpen ? nowMs : lastOut;
  if (end == null) return 0;
  return Math.max(0, Math.floor((end - firstIn) / 60_000));
}

const quickActions = [
  { href: "/leave", label: "Request leave", icon: CalendarDays },
  { href: "/expenses", label: "Submit expense", icon: ReceiptText },
  { href: "/profile", label: "My profile", icon: UserRoundCheck },
  { href: "/documents", label: "My documents", icon: FileBadge },
];

/**
 * Employee home = their timesheet. Punch in/out with GPS, today's worked time,
 * this month at a glance, and recent history. Replaces the manager-oriented
 * command center for the employee role.
 */
export function EmployeeTimesheetHome({ userName }: { userName: string }) {
  const [month] = useState<string>(currentMonth());
  const [location, setLocation] = useState<LocationPickerValue | null>(null);
  const [punchError, setPunchError] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data: today, isLoading: loadingToday } = api.attendance.today.useQuery();
  const { data: history } = api.attendance.myHistory.useQuery({});
  const { data: monthly } = api.attendance.myMonthlySummary.useQuery({ month });
  const { data: goals } = api.retention.goal.mine.useQuery();

  const refetch = () => {
    setPunchError(null);
    utils.attendance.today.invalidate();
    utils.attendance.myHistory.invalidate();
    utils.attendance.myMonthlySummary.invalidate({ month });
  };
  const punchIn = api.attendance.punchIn.useMutation({ onSuccess: refetch, onError: (e) => setPunchError(e.message) });
  const punchOut = api.attendance.punchOut.useMutation({ onSuccess: refetch, onError: (e) => setPunchError(e.message) });

  const records = (today?.records ?? []) as DayRecord[];
  const shift = today?.assignment?.shift;
  const latest = records.find((r) => !r.punchOutAt) ?? records[records.length - 1];
  const punchedIn = !!latest?.punchInAt && !latest?.punchOutAt;
  // Today's hours = first punch-in → last punch-out (supports multiple punches).
  const workedToday = spanMinutes(records, Date.now());

  // This week's total worked = sum of each day's (first-in → last-out) span for
  // days from the start of the current week (Sunday) onward.
  const weekWorked = useMemo(() => {
    const hist = (history ?? []) as DayRecord[];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday = start of week
    const weekStartISO = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    const byDate = new Map<string, DayRecord[]>();
    for (const r of hist) {
      if (r.workDate < weekStartISO) continue;
      const arr = byDate.get(r.workDate) ?? [];
      arr.push(r);
      byDate.set(r.workDate, arr);
    }
    const nowMs = Date.now();
    let total = 0;
    for (const recs of byDate.values()) total += spanMinutes(recs, nowMs);
    return total;
  }, [history]);

  const todayLocation = useMemo<LocationPickerValue | null>(() => {
    if (latest?.punchInLat != null && latest?.punchInLng != null) {
      return { lat: latest.punchInLat, lng: latest.punchInLng, accuracy: latest.punchInAccuracy ?? undefined, siteName: latest.workLocation ?? "Punch-in location" };
    }
    return null;
  }, [latest?.punchInLat, latest?.punchInLng, latest?.punchInAccuracy, latest?.workLocation]);

  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">My timesheet</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Good morning, {firstName}.</h1>
        <p className="mt-1 text-sm text-slate-600">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {shift ? ` · ${shift.name} ${shift.startTime}–${shift.endTime}` : ""}
        </p>
      </div>

      {/* Punch card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          {loadingToday ? (
            <div className="py-8 text-center text-muted-foreground">Loading your timesheet…</div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="text-sm text-muted-foreground">Today&apos;s status</div>
                {latest && (
                  <Badge className={statusBadge[latest.status] ?? statusBadge.present}>
                    {latest.status.replace(/_/g, " ")}
                    {latest.lateMinutes > 0 ? ` · ${latest.lateMinutes}m late` : ""}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Tile label="Punch in" value={fmtTime(latest?.punchInAt ?? null)} icon={<LogIn className="h-4 w-4" />} active={punchedIn} />
                <Tile label="Punch out" value={fmtTime(latest?.punchOutAt ?? null)} icon={<LogOut className="h-4 w-4" />} />
                <Tile label="Worked today" value={fmtMinutes(workedToday)} icon={<Clock className="h-4 w-4" />} />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Punch-in location
                </div>
                <LocationPicker value={todayLocation} onChange={setLocation} variant="compact" readOnly={punchedIn} />
              </div>

              {punchError && (
                <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-700 shrink-0" />
                  <div className="text-red-900">{punchError}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  size="lg"
                  disabled={punchedIn || punchIn.isPending}
                  onClick={() => punchIn.mutate({
                    workLocation: location?.siteName ?? (location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "On-site"),
                    lat: location?.lat,
                    lng: location?.lng,
                    accuracy: location?.accuracy,
                  })}
                >
                  <LogIn className="mr-2 h-4 w-4" /> {punchedIn ? "Punched in" : "Punch in"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={!punchedIn || punchOut.isPending}
                  onClick={() => punchOut.mutate({})}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Punch out
                </Button>
                <Link href="/attendance/me" className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-emerald-800">
                  Full attendance <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Worked-time totals: today, this week, this month + overtime */}
      {monthly && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Worked today" value={fmtMinutes(workedToday)} />
          <Stat label="This week" value={fmtMinutes(weekWorked)} />
          <Stat label="This month" value={fmtMinutes(monthly.summary.totalWorkedMinutes)} />
          <Stat label="Overtime (mo)" value={fmtMinutes(monthly.summary.totalOvertimeMinutes)} />
          <Stat label="Present (mo)" value={monthly.summary.present} />
          <Stat label="Late (mo)" value={monthly.summary.late} sub={fmtMinutes(monthly.summary.totalLateMinutes)} />
        </div>
      )}

      {/* My goals — moved onto the main dashboard */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <Target className="h-4 w-4" />
              </span>
              <h3 className="text-base font-semibold">My goals</h3>
            </div>
            <Link href="/profile" className="text-xs font-semibold text-emerald-800 hover:underline">
              View all →
            </Link>
          </div>
          {goals && goals.length > 0 ? (
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal: { id: string; title: string; status: string; progress: number | null; endDate: string | null }) => (
                <div key={goal.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 ring-1 ring-slate-200">
                      {goal.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-emerald-700" style={{ width: `${goal.progress ?? 0}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-slate-500">
                    <span>{goal.progress ?? 0}% complete</span>
                    <span>Due {goal.endDate ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No goals yet — agree a goal with your manager.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-700/30 hover:shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="h-4 w-4" /></span>
              <span className="flex-1 text-sm font-semibold text-slate-800">{a.label}</span>
              <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-700" />
            </Link>
          );
        })}
      </div>

      {/* Recent history */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4"><h3 className="text-base font-semibold">Recent attendance</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="h-10 px-4 font-medium">Date</th>
                  <th className="h-10 px-4 font-medium">Status</th>
                  <th className="h-10 px-4 font-medium">In</th>
                  <th className="h-10 px-4 font-medium">Out</th>
                  <th className="h-10 px-4 font-medium text-right">Worked</th>
                </tr>
              </thead>
              <tbody>
                {((history ?? []) as DayRecord[]).slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">{r.workDate}</td>
                    <td className="px-4 py-3"><Badge className={statusBadge[r.status] ?? statusBadge.present}>{r.status.replace(/_/g, " ")}</Badge></td>
                    <td className="px-4 py-3">{fmtTime(r.punchInAt)}</td>
                    <td className="px-4 py-3">{fmtTime(r.punchOutAt)}</td>
                    <td className="px-4 py-3 text-right">{fmtMinutes(r.workedMinutes)}</td>
                  </tr>
                ))}
                {(!history || history.length === 0) && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No attendance yet — punch in to get started</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, icon, active }: { label: string; value: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 transition ${active ? "border-primary/40 bg-primary/5" : "border-dashed border-muted-foreground/30 bg-background/40"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold">{value}</div>
        {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}
