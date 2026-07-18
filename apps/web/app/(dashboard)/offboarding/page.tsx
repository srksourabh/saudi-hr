"use client";

import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { LogOut, Plus, User } from "lucide-react";

export default function OffboardingListPage() {
  const settlements = api.settlement.list.useQuery({});

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offboarding</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track knowledge-transfer handover, asset returns, IT revocation, exit interviews,
            rehire eligibility and final settlement for every departing employee.
          </p>
        </div>
        <Link href="/offboarding/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Initiate offboarding
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-amber-700" /> Active and recent offboardings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.isLoading ? (
            <p className="text-sm text-slate-500">Loading offboardings…</p>
          ) : !settlements.data || settlements.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <LogOut className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">No offboardings yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Start one when an employee resigns, ends a contract, transfers, or retires.
              </p>
              <Link href="/offboarding/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Initiate first offboarding
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {settlements.data.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/offboarding/${s.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <User className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {s.employee?.fullName ?? "Employee"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.exitReason?.split(" :: ")[0] ?? "—"} · initiated {new Date(s.createdAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Open
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}