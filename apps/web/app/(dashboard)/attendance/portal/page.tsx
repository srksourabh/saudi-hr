"use client";

import { useState, useMemo } from "react";
import { Button, Card, CardHeader, CardContent, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { LocationPicker, type LocationPickerValue } from "~/components/location-picker";
import { LogIn, LogOut, Search, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, { label: string; className: string }> = {
  present:  { label: "Present",  className: "bg-green-100 text-green-800 border-green-200" },
  late:     { label: "Late",     className: "bg-amber-100 text-amber-800 border-amber-200" },
  absent:   { label: "Absent",   className: "bg-red-100 text-red-800 border-red-200" },
  on_leave: { label: "On leave", className: "bg-blue-100 text-blue-800 border-blue-200" },
  remote:   { label: "Remote",   className: "bg-violet-100 text-violet-800 border-violet-200" },
  half_day: { label: "Half day", className: "bg-orange-100 text-orange-800 border-orange-200" },
};

function formatTime(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePortalPage() {
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; fullName: string } | null>(null);
  const [location, setLocation] = useState<LocationPickerValue | null>(null);
  const utils = api.useUtils();

  const { data: employees, isLoading: loadingEmployees } = api.employee.list.useQuery({
    search: search || undefined,
    status: undefined,
    pageSize: 200,
  } as any);

  const today = todayISO();

  const { data: todayRecords, isLoading: loadingRecords } = api.attendance.list.useQuery({
    from: today,
    to: today,
  } as any);

  const { data: allTodayRecords } = api.attendance.list.useQuery({
    from: today,
    to: today,
  } as any);

  const punchInMutation = api.attendance.punchInForEmployee.useMutation({
    onSuccess: () => {
      utils.attendance.list.invalidate();
      utils.attendance.today.invalidate();
      setLocation(null);
      setSelectedEmployee(null);
    },
  });

  const punchOutMutation = api.attendance.punchOutForEmployee.useMutation({
    onSuccess: () => {
      utils.attendance.list.invalidate();
      utils.attendance.today.invalidate();
      setLocation(null);
      setSelectedEmployee(null);
    },
  });

  const recordsByEmployee = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const rec of allTodayRecords ?? []) {
      const arr = map.get(rec.employeeId) ?? [];
      arr.push(rec);
      map.set(rec.employeeId, arr);
    }
    return map;
  }, [allTodayRecords]);

  function getLatestOpenSequence(empId: string): any {
    const recs = recordsByEmployee.get(empId) ?? [];
    return recs.find((r: any) => !r.punchOutAt) ?? recs[0] ?? null;
  }

  function getEmployeeStatus(empId: string): string {
    const recs = recordsByEmployee.get(empId) ?? [];
    if (!recs.length) return "not_punched";
    const latest = recs[recs.length - 1];
    if (!latest.punchInAt) return "not_punched";
    if (latest.punchOutAt) return "punched_out";
    return "punched_in";
  }

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter((e: any) =>
      e.fullName?.toLowerCase().includes(q) ||
      e.department?.name?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const selectedRecords = selectedEmployee
    ? (recordsByEmployee.get(selectedEmployee.id) ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Employee Attendance</h1>
          <p className="text-muted-foreground">Punch in or out for any employee</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <Users className="inline h-4 w-4 mr-1" />
              {filteredEmployees.length} employees
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600">Employee</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Department</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Punch Sequences</th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingEmployees || loadingRecords ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp: any) => {
                    const status = getEmployeeStatus(emp.id);
                    const recs = recordsByEmployee.get(emp.id) ?? [];
                    const latest = recs[recs.length - 1];
                    const hasOpen = recs.some((r: any) => !r.punchOutAt);

                    return (
                      <tr key={emp.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.department?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          {latest ? (
                            <Badge className={statusBadge[latest.status]?.className ?? statusBadge.present!.className}>
                              {statusBadge[latest.status]?.label ?? latest.status}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">No record</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {recs.map((rec: any, idx: number) => (
                              <span
                                key={rec.id}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  !rec.punchInAt ? "bg-slate-100 text-slate-500" :
                                  rec.punchOutAt ? "bg-green-100 text-green-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}
                                title={`Sequence ${rec.punchSequence}: ${rec.punchInAt ? `In ${formatTime(rec.punchInAt)}` : 'Not punched in'}${rec.punchOutAt ? ` / Out ${formatTime(rec.punchOutAt)}` : ''}`}
                              >
                                #{rec.punchSequence} {rec.punchOutAt ? "✓" : rec.punchInAt ? "⏳" : "○"}
                              </span>
                            ))}
                            {recs.length === 0 && (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={hasOpen || punchInMutation.isPending}
                              onClick={() => {
                                setSelectedEmployee({ id: emp.id, fullName: emp.fullName });
                                setLocation(null);
                              }}
                            >
                              <LogIn className="mr-1 h-3.5 w-3.5" />
                              Punch In
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!hasOpen || punchOutMutation.isPending}
                              onClick={() => {
                                const openRec = recs.find((r: any) => !r.punchOutAt);
                                setSelectedEmployee({ id: emp.id, fullName: emp.fullName });
                                setLocation(
                                  openRec?.punchInLat != null && openRec?.punchInLng != null
                                    ? {
                                        lat: openRec.punchInLat,
                                        lng: openRec.punchInLng,
                                        accuracy: openRec.punchInAccuracy ?? undefined,
                                        siteName: openRec.workLocation ?? "Punch-in location",
                                      }
                                    : null,
                                );
                              }}
                            >
                              <LogOut className="mr-1 h-3.5 w-3.5" />
                              Punch Out
                            </Button>
                            <Link href={`/employees/${emp.id}`}>
                              <Button size="sm" variant="ghost">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Punch Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee?.fullName ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecords.length > 0 && (
              <div className="rounded-md border bg-slate-50 p-3 text-sm space-y-1">
                <div className="font-medium text-slate-700 mb-2">Today&apos;s sequences</div>
                {selectedRecords.map((rec: any) => (
                  <div key={rec.id} className="flex justify-between text-xs">
                    <span className="text-slate-600">
                      #{rec.punchSequence}: {rec.punchInAt ? `In ${formatTime(rec.punchInAt)}` : "Not in"}
                      {rec.punchOutAt ? ` / Out ${formatTime(rec.punchOutAt)}` : " / Open"}
                    </span>
                    <span className={`font-medium ${
                      rec.punchOutAt ? "text-green-600" : rec.punchInAt ? "text-amber-600" : "text-slate-400"
                    }`}>
                      {rec.punchOutAt ? "Closed" : rec.punchInAt ? "Active" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">Punch Location</label>
              <LocationPicker
                value={location}
                onChange={setLocation}
                variant="full"
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={
                  selectedRecords.some((r: any) => !r.punchOutAt) ||
                  punchInMutation.isPending ||
                  !location
                }
                onClick={() => {
                  if (!selectedEmployee || !location) return;
                  punchInMutation.mutate({
                    employeeId: selectedEmployee.id,
                    workLocation: location?.siteName ?? `${location?.lat?.toFixed(4)}, ${location?.lng?.toFixed(4)}`,
                    lat: location.lat,
                    lng: location.lng,
                    accuracy: location.accuracy,
                    notes: location ? `lat=${location.lat},lng=${location.lng}${location.accuracy ? `,acc=${Math.round(location.accuracy)}m` : ""}` : undefined,
                  });
                }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {punchInMutation.isPending ? "Punching in..." : "Punch In"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={
                  !selectedRecords.some((r: any) => !r.punchOutAt) ||
                  punchOutMutation.isPending
                }
                onClick={() => {
                  if (!selectedEmployee) return;
                  const openRec = selectedRecords.find((r: any) => !r.punchOutAt);
                  punchOutMutation.mutate({
                    employeeId: selectedEmployee.id,
                    workLocation: location
                      ? location.siteName ?? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                      : undefined,
                    punchSequence: openRec?.punchSequence,
                  });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {punchOutMutation.isPending ? "Punching out..." : "Punch Out"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
