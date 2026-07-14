"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@hrms-app/ui";
import { api } from "~/trpc/react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calculator,
  CheckCircle2,
  LineChart,
  Save,
  TrendingUp,
  Users,
} from "lucide-react";

type ScenarioRow = {
  department: string;
  currentHeadcount: number;
  plannedHires: number;
  plannedExits: number;
  justification: string;
  budgetLine: string;
};

export default function WorkforcePlanningPage() {
  const departments = api.department.list.useQuery();
  const employees = api.employee.list.useQuery({ status: "active" });
  const openJobs = api.recruitment.jobRequisition.list.useQuery({ status: "open" });

  const [scenarioName, setScenarioName] = useState("H2 2026 plan");
  const [horizon, setHorizon] = useState("6");
  const [rationale, setRationale] = useState(
    "Right-size Field Operations for the new Jubail Site contract. Increase PMO capacity for ARAMCO deliverables. Hold finance flat pending automation."
  );
  const [rows, setRows] = useState<ScenarioRow[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const forecast = useMemo(() => {
    const empList: any[] = employees.data?.items ?? [];
    const deptList: any[] = departments.data?.items ?? [];
    const jobList: any[] = openJobs.data?.items ?? [];
    const horizonMonths = Number(horizon) || 6;
    return deptList.map((d: any) => {
      const headcount = empList.filter((e: any) => e.departmentId === d.id).length;
      const plannedHires = jobList.filter((j: any) => j.departmentId === d.id).length;
      const plannedExits = 0;
      const existing = rows.find((r) => r.department === d.name);
      return {
        department: d.name,
        currentHeadcount: headcount,
        plannedHires,
        plannedExits: existing?.plannedExits ?? plannedExits,
        justification: existing?.justification ?? "",
        budgetLine: existing?.budgetLine ?? `OPEX-${d.code ?? d.id?.slice(0, 4)?.toUpperCase() ?? "GEN"}`,
      };
    });
  }, [employees.data, departments.data, openJobs.data, horizon, rows]);

  function update<K extends keyof ScenarioRow>(dept: string, key: K, value: ScenarioRow[K]) {
    setRows((prev) => {
      const existing = prev.find((r) => r.department === dept);
      if (existing) {
        return prev.map((r) => (r.department === dept ? { ...r, [key]: value } : r));
      }
      const base = forecast.find((f) => f.department === dept);
      return [
        ...prev,
        {
          department: dept,
          currentHeadcount: base?.currentHeadcount ?? 0,
          plannedHires: base?.plannedHires ?? 0,
          plannedExits: 0,
          justification: "",
          budgetLine: `OPEX-${dept.slice(0, 4).toUpperCase()}`,
          [key]: value,
        },
      ];
    });
  }

  const totals = useMemo(() => {
    const current = forecast.reduce((s, r) => s + r.currentHeadcount, 0);
    const hires = forecast.reduce((s, r) => s + (r.plannedHires || 0), 0);
    const exits = forecast.reduce((s, r) => s + (r.plannedExits || 0), 0);
    const avgCostPerHire = 8500;
    const projected = current + hires - exits;
    return {
      current,
      hires,
      exits,
      projected,
      costEstimate: hires * avgCostPerHire,
      horizon: Number(horizon) || 6,
    };
  }, [forecast, horizon]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Workforce planning</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Headcount forecast &amp; requisition justification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Document the business case before opening a position — replacement vs. net-new, budget line,
          projected cost, and Saudization impact. This is Stage 0 of the recruitment life cycle (PRD §2.15).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="space-y-1 p-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5" /> Current headcount
            </div>
            <p className="text-2xl font-semibold text-slate-950">{totals.current}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Briefcase className="h-3.5 w-3.5" /> Open positions
            </div>
            <p className="text-2xl font-semibold text-slate-950">{totals.hires}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <TrendingUp className="h-3.5 w-3.5" /> Planned exits
            </div>
            <p className="text-2xl font-semibold text-slate-950">{totals.exits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-5">
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <LineChart className="h-3.5 w-3.5" /> Projected headcount
            </div>
            <p className="text-2xl font-semibold text-emerald-800">{totals.projected}</p>
            <p className="text-[11px] text-slate-500">In {totals.horizon} months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calculator className="h-3.5 w-3.5" /> Recruit cost estimate
            </div>
            <p className="text-2xl font-semibold text-slate-950">SAR {totals.costEstimate.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500">SAR 8,500 avg per hire</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChart className="h-5 w-5 text-emerald-700" /> Scenario definition
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="scenario">Scenario name</Label>
            <Input id="scenario" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="horizon">Horizon (months)</Label>
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label>Reviewer</Label>
            <Input value="Reem Al-Harbi · HR Manager" disabled />
          </div>
          <div className="space-y-1.5 md:col-span-3">
            <Label htmlFor="rationale">Strategic rationale</Label>
            <Textarea id="rationale" rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department-level plan</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Department</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">Hires</th>
                <th className="px-3 py-2 text-right">Exits</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2 text-left">Budget line</th>
                <th className="px-3 py-2 text-left">Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecast.map((row) => {
                const override = rows.find((r) => r.department === row.department);
                const hires = override?.plannedHires ?? row.plannedHires;
                const exits = override?.plannedExits ?? row.plannedExits;
                const net = hires - exits;
                return (
                  <tr key={row.department} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{row.department}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.currentHeadcount}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={hires}
                        onChange={(e) => update(row.department, "plannedHires", Number(e.target.value))}
                        className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        value={exits}
                        onChange={(e) => update(row.department, "plannedExits", Number(e.target.value))}
                        className="w-16 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {net >= 0 ? "+" : ""}{net}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={override?.budgetLine ?? row.budgetLine}
                        onChange={(e) => update(row.department, "budgetLine", e.target.value)}
                        className="w-32 rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={override?.justification ?? ""}
                        onChange={(e) => update(row.department, "justification", e.target.value)}
                        placeholder="e.g. New ARAMCO contract"
                        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 text-sm font-semibold">
              <tr>
                <td className="px-3 py-2 text-slate-900">Total</td>
                <td className="px-3 py-2 text-right text-slate-900">{totals.current}</td>
                <td className="px-3 py-2 text-right text-emerald-700">{totals.hires}</td>
                <td className="px-3 py-2 text-right text-rose-700">{totals.exits}</td>
                <td className="px-3 py-2 text-right text-slate-900">{totals.projected - totals.current}</td>
                <td className="px-3 py-2" colSpan={2}>
                  Cost: SAR {totals.costEstimate.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {totals.hires > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-700" /> Approval gates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                "Business case documented per department with budget line",
                "Net Saudization impact assessed vs. current 83% rate",
                "Replacement vs. net-new classified for every position",
                "Cost estimate reviewed against Finance Plan",
                "Hiring manager and CFO sign-off recorded in workflow log",
              ].map((gate) => (
                <li key={gate} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-slate-700">{gate}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        {submitted ? (
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Scenario <strong className="mx-1">{scenarioName}</strong> saved as draft · ready for CFO review.
            <Link href="/recruitment/jobs/new" className="ml-3 inline-flex items-center gap-1 font-semibold text-emerald-700">
              Open requisition <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Save the scenario as a draft to attach it to a job requisition.</p>
        )}
        <Button onClick={() => setSubmitted(true)} disabled={submitted}>
          <Save className="mr-2 h-4 w-4" /> {submitted ? "Saved" : "Save scenario"}
        </Button>
      </div>
    </div>
  );
}