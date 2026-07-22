"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { Button, Card, CardContent } from "@hrms-app/ui";
import { Landmark, Printer, Download, FileText, Send, CheckCircle2, AlertTriangle } from "lucide-react";

function sar(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return `SAR ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function periodLabel(periodMonth: string | null | undefined): string {
  if (!periodMonth) return "—";
  const [y, m] = periodMonth.split("-").map(Number);
  if (!y || !m) return periodMonth;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function MyPayrollPage() {
  const { data: payslips, isLoading } = api.payroll.payslip.mine.useQuery();
  const { data: me } = api.employee.me.useQuery();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionSent, setCorrectionSent] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const requestCorrection = api.payroll.payslip.requestCorrection.useMutation({
    onSuccess: () => {
      setCorrectionSent(true);
      setCorrectionText("");
      setCorrectionError(null);
    },
    onError: (e) => setCorrectionError(e.message),
  });

  const list = payslips ?? [];
  const selected = useMemo(
    () => list.find((p: any) => p.id === selectedId) ?? list[0] ?? null,
    [list, selectedId],
  );

  return (
    <div className="space-y-6">
      {/* Print rule: when printing, show only the payslip card. Lets the browser
          "Save as PDF" produce a clean one-page payslip (no sidebar/nav). */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #payslip-print, #payslip-print * { visibility: visible !important; }
          #payslip-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
          <Landmark className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payroll</h1>
          <p className="text-sm text-muted-foreground">View and download your payslips and salary breakdown</p>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading your payslips…</CardContent></Card>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-700">No payslips yet</h3>
            <p className="mt-1 text-sm text-slate-500">Your payslips will appear here after HR runs payroll.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Payslip list */}
          <div className="no-print space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Payslips</p>
            {list.map((p: any) => {
              const isActive = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedId(p.id); setCorrectionSent(false); setCorrectionError(null); }}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isActive ? "border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-200" : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{periodLabel(p.payrollRun?.periodMonth)}</span>
                    <span className="text-xs capitalize text-slate-400">{p.payrollRun?.status ?? ""}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">Net {sar(p.netPay)}</div>
                </button>
              );
            })}
          </div>

          {/* Selected payslip detail */}
          {selected && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6" id="payslip-print">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Payslip</p>
                      <h2 className="mt-0.5 text-2xl font-bold text-slate-900">{periodLabel(selected.payrollRun?.periodMonth)}</h2>
                      <p className="mt-0.5 text-sm text-slate-500">{me?.fullName ?? "Employee"}{me?.department?.name ? ` · ${me.department.name}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Net pay</p>
                      <p className="text-2xl font-bold text-emerald-700">{sar(selected.netPay)}</p>
                    </div>
                  </div>

                  <div className="grid gap-6 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Earnings</p>
                      <Row label="Basic" value={sar(selected.basic)} />
                      <Row label="Housing" value={sar(selected.housing)} />
                      <Row label="Transport" value={sar(selected.transport)} />
                      <Row label="Overtime" value={sar(selected.overtime)} />
                      <Row label="Gross" value={sar(selected.gross)} strong />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Deductions</p>
                      <Row label="GOSI (employee)" value={sar(selected.gosiEmployee)} />
                      <Row label="Other deductions" value={sar(selected.deductions)} />
                      <Row label="Net pay" value={sar(selected.netPay)} strong />
                    </div>
                  </div>

                  {selected.eosbAccrued != null && Number(selected.eosbAccrued) > 0 && (
                    <p className="mt-4 text-xs text-slate-500">
                      End-of-service accrued this period: <strong>{sar(selected.eosbAccrued)}</strong>
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="no-print flex flex-wrap gap-3">
                <Button onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" /> Download / Print
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
              </div>

              {/* Request a correction */}
              <Card className="no-print">
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold text-slate-900">Request a correction</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Something looks wrong on this payslip? Describe it and we&apos;ll send it to HR to review.
                  </p>
                  {correctionSent ? (
                    <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <CheckCircle2 className="h-4 w-4" /> Your correction request has been sent to HR.
                    </div>
                  ) : (
                    <>
                      <textarea
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        rows={3}
                        placeholder="e.g. My overtime hours for this month look too low."
                        className="mt-3 w-full rounded-md border border-slate-300 bg-white p-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                      />
                      {correctionError && (
                        <div className="mt-2 flex items-start gap-2 text-sm text-rose-700">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {correctionError}
                        </div>
                      )}
                      <Button
                        className="mt-3"
                        disabled={requestCorrection.isPending || correctionText.trim().length < 5}
                        onClick={() => requestCorrection.mutate({ payslipId: selected.id, message: correctionText.trim() })}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {requestCorrection.isPending ? "Sending…" : "Send to HR"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-slate-100 py-1.5 text-sm ${strong ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
