"use client";

import { api } from "~/trpc/react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { useState } from "react";

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  draft: { variant: "secondary", className: "bg-gray-100 text-gray-800 border-gray-200" },
  pre_check: { variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { variant: "default", className: "bg-green-100 text-green-800 border-green-200" },
  completed: { variant: "default", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200" },
};

const statusOptions = ["draft", "pre_check", "ready", "completed", "cancelled"];

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utils = api.useUtils();
  const { data: run, isLoading } = api.payroll.run.getById.useQuery(id);
  const [newStatus, setNewStatus] = useState("");

  const updateStatusMutation = api.payroll.run.updateStatus.useMutation({
    onSuccess: () => {
      utils.payroll.run.getById.invalidate(id);
      utils.payroll.run.list.invalidate();
      setNewStatus("");
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!run) return <div>Payroll run not found</div>;

  const badge = statusBadge[run.status as keyof typeof statusBadge] ?? statusBadge.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Run: {run.periodMonth}</h1>
          <p className="text-muted-foreground">Payroll period details</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/payroll")}>
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={badge!.variant} className={badge!.className}>
              {run.status.replace("_", " ")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {run.totalAmount ? `${Number(run.totalAmount).toLocaleString()} SAR` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed At</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{run.completedAt ? new Date(run.completedAt).toLocaleDateString() : "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select status</option>
            {statusOptions.map((s: any) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              if (newStatus) updateStatusMutation.mutate({ id, data: { status: newStatus as any } });
            }}
            disabled={!newStatus || updateStatusMutation.isPending}
          >
            Update
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payslips ({run.payslips?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Basic</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Housing</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Transport</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Overtime</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">GOSI (Emp)</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">GOSI (Empr)</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Deductions</th>
                  <th className="h-10 px-3 text-left font-medium text-muted-foreground">Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {run.payslips?.map((slip: any) => (
                  <tr key={slip.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 align-middle">{slip.employee?.fullName}</td>
                    <td className="p-3 align-middle">{Number(slip.basic).toLocaleString()}</td>
                    <td className="p-3 align-middle">{Number(slip.housing).toLocaleString()}</td>
                    <td className="p-3 align-middle">{Number(slip.transport).toLocaleString()}</td>
                    <td className="p-3 align-middle">{Number(slip.overtime).toLocaleString()}</td>
                    <td className="p-3 align-middle">{Number(slip.gosiEmployee).toLocaleString()}</td>
                    <td className="p-3 align-middle">{Number(slip.gosiEmployer).toLocaleString()}</td>
                    <td className="p-3 align-middle">{Number(slip.deductions).toLocaleString()}</td>
                    <td className="p-3 align-middle font-medium">{Number(slip.netPay).toLocaleString()}</td>
                  </tr>
                ))}
                {(!run.payslips || run.payslips.length === 0) && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-muted-foreground">
                      No payslips yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Checks</CardTitle>
          </CardHeader>
          <CardContent>
            {run.complianceChecks && run.complianceChecks.length > 0 ? (
              <div className="space-y-2">
                {run.complianceChecks.map((check: any) => (
                  <div key={check.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium">{check.checkType}</span>
                    <Badge
                      variant={check.status === "passed" ? "default" : check.status === "flagged" ? "secondary" : "destructive"}
                      className={
                        check.status === "passed"
                          ? "bg-green-100 text-green-800"
                          : check.status === "flagged"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No compliance checks</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wage Files</CardTitle>
          </CardHeader>
          <CardContent>
            {run.wageFiles && run.wageFiles.length > 0 ? (
              <div className="space-y-2">
                {run.wageFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium">{file.format.toUpperCase()}</span>
                    <span className="text-muted-foreground">
                      {file.submittedAt ? new Date(file.submittedAt).toLocaleDateString() : "Not submitted"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No wage files generated</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
