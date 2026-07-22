"use client";

import { api } from "~/trpc/react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Badge } from "@hrms-app/ui";
import { Check, X, Plus } from "lucide-react";
import Link from "next/link";

const statusTabs = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" as const },
  { label: "Approved", value: "approved" as const },
  { label: "Rejected", value: "rejected" as const },
];

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pending: { variant: "outline", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
  rejected: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

export default function LeavePage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const utils = api.useUtils();
  const { data: session } = useSession();
  const isEmployee = session?.user?.role === "employee";

  // Employees may not call the company-scoped `list` (RBAC: leave:view_company).
  // They read their OWN requests via `my`; managers/HR keep the full queue with
  // the server-side status filter. This is why a submitted request looked
  // "missing" — the page previously called the forbidden `list` for everyone.
  const myQuery = api.leave.request.my.useQuery(undefined, { enabled: isEmployee });
  const listQuery = api.leave.request.list.useQuery(
    { status: statusFilter as any },
    { enabled: !isEmployee },
  );
  const approveMutation = api.leave.request.updateStatus.useMutation({
    onSuccess: () => {
      utils.leave.request.list.invalidate();
      utils.leave.request.my.invalidate();
    },
  });

  const isLoading = isEmployee ? myQuery.isLoading : listQuery.isLoading;
  // `my` returns every status; apply the tab filter client-side for employees.
  const requests = isEmployee
    ? (myQuery.data ?? []).filter((r: any) => !statusFilter || r.status === statusFilter)
    : listQuery.data;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isEmployee ? "My Leave Requests" : "Leave Requests"}</h1>
          <p className="text-muted-foreground">
            {isEmployee ? "Track your time-off requests and their approval status" : "Manage employee leave requests"}
          </p>
        </div>
        <Button asChild>
          <Link href="/leave/new">
            <Plus className="mr-2 h-4 w-4" /> New Leave Request
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {statusTabs.map((tab: any) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              statusFilter === tab.value
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {!isEmployee && <th className="h-12 px-4 text-left font-medium text-muted-foreground">Employee</th>}
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Leave Type</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Start Date</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">End Date</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
              {!isEmployee && <th className="h-12 px-4 text-left font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests?.map((req: any) => {
              const badge = statusBadge[req.status as keyof typeof statusBadge] ?? statusBadge.pending;
              return (
                <tr key={req.id} className="border-b hover:bg-muted/50">
                  {!isEmployee && <td className="p-4 align-middle">{req.employee?.fullName}</td>}
                  <td className="p-4 align-middle">{req.leaveType?.name}</td>
                  <td className="p-4 align-middle">{req.startDate}</td>
                  <td className="p-4 align-middle">{req.endDate}</td>
                  <td className="p-4 align-middle">
                    <Badge variant={badge!.variant} className={badge!.className}>
                      {req.status}
                    </Badge>
                  </td>
                  {!isEmployee && (
                    <td className="p-4 align-middle">
                      {req.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => approveMutation.mutate({ id: req.id, data: { status: "approved" } })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => approveMutation.mutate({ id: req.id, data: { status: "rejected" } })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {(!requests || requests.length === 0) && (
              <tr>
                <td colSpan={isEmployee ? 4 : 6} className="p-4 text-center text-muted-foreground">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
