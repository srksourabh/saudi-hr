"use client";

import { useMemo, useState } from "react";
import { Button, Input, Card, CardHeader, CardContent, Badge } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { LocationPicker, type LocationPickerValue } from "~/components/location-picker";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";

const statusBadge: Record<string, { label: string; className: string }> = {
  present:    { label: "Present",    className: "bg-green-100 text-green-800 border-green-200" },
  late:       { label: "Late",       className: "bg-amber-100 text-amber-800 border-amber-200" },
  absent:     { label: "Absent",     className: "bg-red-100 text-red-800 border-red-200" },
  on_leave:   { label: "On leave",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  remote:     { label: "Remote",     className: "bg-violet-100 text-violet-800 border-violet-200" },
  half_day:   { label: "Half day",   className: "bg-orange-100 text-orange-800 border-orange-200" },
  holiday:    { label: "Holiday",    className: "bg-slate-100 text-slate-700 border-slate-200" },
  weekend:    { label: "Weekend",    className: "bg-slate-100 text-slate-700 border-slate-200" },
};

function formatMinutes(min: number): string {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function shiftMonth(d: Date, delta: number): Date {
  const next = new Date(d);
  next.setMonth(next.getMonth() + delta);
  return next;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function AttendancePage() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

  const [search, setSearch] = useState("");

  const { data: report, isLoading } = api.attendance.monthlyReport.useQuery({ month: monthStr });
  const { data: exceptions } = api.attendance.exceptions.useQuery({ status: "open" });

  const filtered = useMemo(() => {
    if (!report?.employees) return [];
    if (!search.trim()) return report.employees;
    const s = search.toLowerCase();
    return report.employees.filter((e: any) => e.fullName.toLowerCase().includes(s));
  }, [report?.employees, search]);

  const totals = useMemo(() => {
    const t = { present: 0, late: 0, absent: 0, onLeave: 0, remote: 0, halfDay: 0, overtime: 0, lateMin: 0 };
    if (!report?.employees) return t;
    for (const e of report.employees) {
      t.present += e.summary.present;
      t.late += e.summary.late;
      t.absent += e.summary.absent;
      t.onLeave += e.summary.onLeave;
      t.remote += e.summary.remote;
      t.halfDay += e.summary.halfDay;
      t.overtime += e.summary.totalOvertimeMinutes;
      t.lateMin += e.summary.totalLateMinutes;
    }
    return t;
  }, [report?.employees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Monthly attendance across all employees</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(shiftMonth(cursor, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-2 text-sm font-medium w-44 text-center rounded-md border bg-muted/30">
            <Calendar className="inline h-4 w-4 mr-2 text-muted-foreground" />
            {monthLabel(cursor)}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCursor(shiftMonth(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatTile label="Present" value={totals.present} color="green" />
        <StatTile label="Late" value={totals.late} color="amber" sub={formatMinutes(totals.lateMin)} />
        <StatTile label="Absent" value={totals.absent} color="red" />
        <StatTile label="On leave" value={totals.onLeave} color="blue" />
        <StatTile label="Remote" value={totals.remote} color="violet" />
        <StatTile label="Half day" value={totals.halfDay} color="orange" />
        <StatTile label="Overtime" value={formatMinutes(totals.overtime)} color="slate" />
      </div>

      {exceptions && exceptions.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <h3 className="text-sm font-semibold text-amber-900">
              Open attendance exceptions ({exceptions.length})
            </h3>
          </CardHeader>
          <CardContent className="text-xs text-amber-800 space-y-1">
            {exceptions.slice(0, 5).map((exc: any) => (
              <div key={exc.id} className="flex items-center justify-between">
                <span>
                  {exc.employee?.fullName} · {exc.exceptionType.replace(/_/g, " ")}
                </span>
                <span className="text-muted-foreground">
                  {exc.record?.workDate} · {exc.minutes ? `${exc.minutes}m` : "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Employee</th>
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Department</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Present</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Late</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Absent</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Leave</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Remote</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Half day</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">Worked</th>
                    <th className="h-12 px-4 text-center font-medium text-muted-foreground">OT</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row: any) => (
                    <tr key={row.employeeId} className="border-b hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">{row.fullName}</td>
                      <td className="p-4 align-middle text-muted-foreground">{row.department ?? "—"}</td>
                      <td className="p-4 align-middle text-center">
                        <Badge className={statusBadge.present!.className}>{row.summary.present}</Badge>
                      </td>
                      <td className="p-4 align-middle text-center">
                        {row.summary.late > 0 ? (
                          <Badge className={statusBadge.late!.className}>
                            {row.summary.late} · {formatMinutes(row.summary.totalLateMinutes)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {row.summary.absent > 0 ? (
                          <Badge className={statusBadge.absent!.className}>{row.summary.absent}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {row.summary.onLeave > 0 ? (
                          <Badge className={statusBadge.on_leave!.className}>{row.summary.onLeave}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {row.summary.remote > 0 ? (
                          <Badge className={statusBadge.remote!.className}>{row.summary.remote}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {row.summary.halfDay > 0 ? (
                          <Badge className={statusBadge.half_day!.className}>{row.summary.halfDay}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {formatMinutes(row.summary.totalWorkedMinutes)}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {formatMinutes(row.summary.totalOvertimeMinutes)}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        No data for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  color: "green" | "amber" | "red" | "blue" | "violet" | "orange" | "slate";
  sub?: string;
}) {
  const tones: Record<string, string> = {
    green: "border-green-200 bg-green-50/40 text-green-900",
    amber: "border-amber-200 bg-amber-50/40 text-amber-900",
    red: "border-red-200 bg-red-50/40 text-red-900",
    blue: "border-blue-200 bg-blue-50/40 text-blue-900",
    violet: "border-violet-200 bg-violet-50/40 text-violet-900",
    orange: "border-orange-200 bg-orange-50/40 text-orange-900",
    slate: "border-slate-200 bg-slate-50/40 text-slate-900",
  };
  return (
    <Card className={tones[color]}>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub ? <div className="text-xs mt-0.5 opacity-70">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}
