"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@hrms-app/ui";
import {
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  Loader2,
  ChevronRight,
  Download,
} from "lucide-react";

export default function ManagerHistoryPage() {
  const reports = api.employee.myDirectReports.useQuery();
  const pendingExpenses = api.expense.list.useQuery({ pendingFor: "me" });
  const leaveRequests = api.leave.request.list.useQuery();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<"team" | "expenses" | "leave" | "report">("team");

  const approveExpense = api.expense.approve.useMutation({
    onSuccess: () => {
      pendingExpenses.refetch();
    },
  });

  const updateLeaveStatus = api.leave.request.updateStatus.useMutation({
    onSuccess: () => {
      leaveRequests.refetch();
    },
  });

  const directReportList = reports.data ?? [];
  const directReportIds = new Set(directReportList.map((r: any) => r.id));

  const teamLeave = (leaveRequests.data ?? []).filter((l: any) => directReportIds.has(l.employeeId));
  const pendingLeave = teamLeave.filter((l: any) => l.status === "pending");

  if (reports.isLoading) {
    return (
      <div className="flex items-center gap-2 p-12 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading manager workspace…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Manager Supervision</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manager History & Team Control</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your direct reports' history, action leave & expense requests, and generate monthly reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              {directReportList.length} Direct Report{directReportList.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "team" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Users className="h-4 w-4" /> Team Direct Reports ({directReportList.length})
          </button>
          <button
            onClick={() => setActiveTab("leave")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "leave" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Calendar className="h-4 w-4" /> Leave Approvals ({pendingLeave.length} pending)
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "expenses" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <DollarSign className="h-4 w-4" /> Expense Claims ({pendingExpenses.data?.length ?? 0} pending)
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "report" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" /> Monthly Team Report
          </button>
        </div>
      </section>

      {/* Tab Content: Direct Reports List */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Direct Reports Information</h2>
          {directReportList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No employees report to you directly yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {directReportList.map((emp: any) => (
                <div key={emp.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{emp.fullName}</h3>
                      <p className="text-xs text-slate-500">{emp.jobTitle ?? emp.designation?.title ?? "Employee"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 capitalize">
                      {emp.employmentStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>Department: <strong className="text-slate-900">{emp.department?.name ?? "Unassigned"}</strong></p>
                    <p>Nationality: <strong className="text-slate-900 capitalize">{emp.nationality}</strong></p>
                    <p>Hire Date: <strong className="text-slate-900">{emp.hireDate}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Leave Approvals */}
      {activeTab === "leave" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Leave Requests for Direct Reports</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Leave Type</th>
                  <th className="px-4 py-3 text-left">Dates</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamLeave.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">{l.employee?.fullName ?? "Employee"}</td>
                    <td className="px-4 py-3 text-slate-700">{l.leaveType?.name ?? "Leave"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{l.startDate} to {l.endDate}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        l.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                        l.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                            onClick={() => updateLeaveStatus.mutate({ id: l.id, data: { status: "approved" } })}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() => updateLeaveStatus.mutate({ id: l.id, data: { status: "rejected" } })}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {teamLeave.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">No leave requests found for direct reports.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Expenses */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Expense Claims Awaiting Your Approval</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(pendingExpenses.data ?? []).map((ex: any) => (
                  <tr key={ex.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900">{ex.employee?.fullName}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 capitalize">{ex.category}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{ex.description}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{ex.amount} {ex.currency}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                          onClick={() => approveExpense.mutate({ id: ex.id, action: "approve" })}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) approveExpense.mutate({ id: ex.id, action: "reject", rejectionReason: reason });
                          }}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(pendingExpenses.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">No expense claims pending your approval.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Monthly Team Report */}
      {activeTab === "report" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Monthly Direct Reports Performance Report</h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 p-2 text-sm text-slate-800"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900">Monthly Supervision Summary: {selectedMonth}</h3>
                <p className="text-xs text-slate-500">Generated report for all {directReportList.length} direct report(s)</p>
              </div>
              <Button onClick={() => window.print()} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Print / Export PDF
              </Button>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Employee Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Approved Leaves</th>
                  <th className="px-4 py-3 text-left">Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directReportList.map((emp: any) => {
                  const empLeaves = teamLeave.filter((l: any) => l.employeeId === emp.id && l.status === "approved").length;
                  return (
                    <tr key={emp.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{emp.fullName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{emp.department?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-emerald-700 font-semibold capitalize">{emp.employmentStatus}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{empLeaves} Approved</td>
                      <td className="px-4 py-3 text-xs text-slate-500">Direct Supervised</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
