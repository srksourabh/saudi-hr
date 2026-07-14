"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { ArrowLeft, CheckCircle2, UserPlus, Briefcase, FileSignature, ShieldCheck, GitBranch, ChevronRight } from "lucide-react";

type Step = "intent" | "form" | "submitted";

export default function NewEmployeePage() {
  const router = useRouter();
  const utils = api.useUtils();
  const session = api.auth.session.useQuery();
  const role = session.data?.user?.role ?? "employee";
  const isHR = role === "hr_manager" || role === "super_admin";
  const isEmployee = role === "employee";
  const { data: departments } = api.department.list.useQuery();
  const { data: managersData } = api.employee.list.useQuery({ pageSize: 200 });

  const [step, setStep] = useState<Step>("intent");
  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState<"saudi" | "expat">("saudi");
  const [hireDate, setHireDate] = useState("");
  const [salaryBasic, setSalaryBasic] = useState("");
  const [salaryHousing, setSalaryHousing] = useState("");
  const [salaryTransport, setSalaryTransport] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [managerEmployeeId, setManagerEmployeeId] = useState("");
  const [gosiSystem, setGosiSystem] = useState("");
  const [error, setError] = useState("");

  // Pre-fill from session for employee self-onboarding
  useEffect(() => {
    if (isEmployee && session.data?.user?.name) {
      setFullName(session.data.user.name);
    }
  }, [isEmployee, session.data?.user?.name]);

  const createMutation = api.employee.create.useMutation({
    onSuccess: () => {
      utils.employee.list.invalidate();
      setStep("submitted");
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Full name is required"); return; }
    if (!hireDate) { setError("Hire date is required"); return; }
    if (!salaryBasic || Number(salaryBasic) <= 0) { setError("Basic salary must be positive"); return; }

    createMutation.mutate({
      fullName: fullName.trim(),
      nationality,
      hireDate,
      salaryBasic: Number(salaryBasic),
      salaryHousing: Number(salaryHousing) || 0,
      salaryTransport: Number(salaryTransport) || 0,
      departmentId: (departmentId || undefined) as any,
      managerEmployeeId: (managerEmployeeId || undefined) as any,
      gosiSystem: (gosiSystem as "old" | "new") || undefined,
    });
  };

  const managers = (managersData ?? []).filter((m: any) => m.id !== session.data?.user?.employeeId);
  const selectedDepartment = (departments?.items ?? departments ?? []).find((d: any) => d.id === departmentId);
  const selectedManager = managers.find((m: any) => m.id === managerEmployeeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEmployee ? "Self-onboarding" : "Add a new employee"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEmployee
              ? "Submit your own employee record for HR approval. You can edit and resubmit if anything is missing."
              : "Create a new employee record in the workspace."}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Step number={1} active={step === "intent"} done={step !== "intent"} label="Choose path" />
        <ChevronRight className="h-3 w-3" />
        <Step number={2} active={step === "form"} done={step === "submitted"} label="Fill details" />
        <ChevronRight className="h-3 w-3" />
        <Step number={3} active={step === "submitted"} done={false} label="Submitted" />
      </div>

      {step === "intent" && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Self-onboarding path — visible to employees and HR */}
          <button
            type="button"
            onClick={() => setStep("form")}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-emerald-300 hover:shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Self-onboarding submission</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isEmployee
                  ? "You file your own record. HR reviews and approves; you can edit and resubmit until then."
                  : "Walk a new hire through the form on their first day. Their line manager is notified for approval."}
              </p>
            </div>
            <span className="mt-2 text-sm font-semibold text-emerald-700 group-hover:underline">Start self-onboarding →</span>
          </button>

          {/* HR-direct path — only HR */}
          {isHR && (
            <button
              type="button"
              onClick={() => setStep("form")}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-amber-300 hover:shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">HR direct entry</h2>
                <p className="mt-1 text-sm text-slate-500">
                  You have full HR permissions. The record is created immediately and the employee
                  can sign in with the welcome email.
                </p>
              </div>
              <span className="mt-2 text-sm font-semibold text-amber-700 group-hover:underline">Create record directly →</span>
            </button>
          )}

          {!isHR && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              <strong className="text-slate-700">HR can also create records directly.</strong>
              Your submission will be reviewed by HR and added to the organogram once approved.
            </div>
          )}
        </div>
      )}

      {step === "form" && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">{error}</div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name *</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Employee full name" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nationality *</label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value as "saudi" | "expat")}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                  >
                    <option value="saudi">Saudi</option>
                    <option value="expat">Expat</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hire Date *</label>
                  <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                  >
                    <option value="">No department</option>
                    {(departments ?? []).map((dept: any) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Reporting line manager</label>
                  <select
                    value={managerEmployeeId}
                    onChange={(e) => setManagerEmployeeId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                  >
                    <option value="">No manager / top of chain</option>
                    {managers.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.department?.name ? `· ${m.department.name}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    {selectedManager
                      ? `Expenses, leave and goals you submit will route to ${selectedManager.fullName} for approval.`
                      : "Set a manager to plug into the organogram and the approval workflow."}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Basic Salary (SAR) *</label>
                  <Input type="number" min="0" step="0.01" value={salaryBasic} onChange={(e) => setSalaryBasic(e.target.value)} placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Housing Allowance (SAR)</label>
                  <Input type="number" min="0" step="0.01" value={salaryHousing} onChange={(e) => setSalaryHousing(e.target.value)} placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Transport Allowance (SAR)</label>
                  <Input type="number" min="0" step="0.01" value={salaryTransport} onChange={(e) => setSalaryTransport(e.target.value)} placeholder="0.00" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">GOSI System</label>
                  <select
                    value={gosiSystem}
                    onChange={(e) => setGosiSystem(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                  >
                    <option value="">Not applicable</option>
                    <option value="old">Old</option>
                    <option value="new">New</option>
                  </select>
                </div>
              </div>

              {/* Live preview of the organogram link */}
              {(selectedDepartment || selectedManager) && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-emerald-900">
                    <GitBranch className="h-4 w-4" /> This record will land in:
                  </p>
                  <p className="mt-1 text-emerald-900">
                    {selectedDepartment?.name ?? "Unassigned"} ·{" "}
                    reports to {selectedManager?.fullName ?? "no manager (top of chain)"}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? "Submitting…"
                    : isHR
                    ? "Create employee"
                    : "Submit for HR review"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep("intent")}>
                  Back
                </Button>
                <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  All data is encrypted at rest. RBAC and ownership enforced.
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === "submitted" && (
        <Card>
          <CardContent className="space-y-5 p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Submission received</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {isHR
                  ? "The employee record has been created. You can review it under the People workspace."
                  : "Your record is in HR's review queue. You can edit and resubmit if anything is missing. HR will notify you when approved."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" onClick={() => router.push("/employees")}>
                View people directory
              </Button>
              <Button variant="outline" onClick={() => router.push("/departments/organogram")}>
                <GitBranch className="mr-1.5 h-4 w-4" /> See organogram
              </Button>
              <Button onClick={() => router.push("/expenses")}>
                <FileSignature className="mr-1.5 h-4 w-4" /> Submit an expense
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Step({ number, active, done, label }: { number: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-slate-900" : done ? "text-emerald-700" : "text-slate-400"}`}>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${
          active
            ? "bg-slate-900 text-white ring-slate-900"
            : done
            ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
            : "bg-slate-50 text-slate-500 ring-slate-200"
        }`}
      >
        {done ? "✓" : number}
      </span>
      {label}
    </div>
  );
}