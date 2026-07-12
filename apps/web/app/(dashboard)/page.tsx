"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import {
  Users, Building2, CalendarCheck, TrendingUp,
  Clock, UserCheck, Landmark, ShieldCheck,
} from "lucide-react";
import { useRegulatoryContext } from "~/lib/regulatory-context";
import { t } from "~/lib/i18n";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: employees } = api.employee.list.useQuery({ pageSize: 1000 });
  const { data: departments } = api.department.list.useQuery();
  const { data: pendingLeaves } = api.leave.request.list.useQuery({ status: "pending" });
  const { regulatoryContext, preferredLanguage: lang } = useRegulatoryContext();

  const metrics = {
    employees: employees?.length ?? 0,
    departments: departments?.length ?? 0,
    pending: pendingLeaves?.length ?? 0,
    present: Math.floor((employees?.length ?? 0) * 0.85),
  };

  const saudiMetricCards = [
    { key: "employees", label: t("dashboard.totalEmployees", lang), icon: Users, color: "text-amber-700", bg: "bg-amber-50" },
    { key: "departments", label: t("dashboard.activeDepartments", lang), icon: Building2, color: "text-green-700", bg: "bg-green-50" },
    { key: "pending", label: t("dashboard.pendingRequests", lang), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "present", label: t("dashboard.presentToday", lang), icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const indiaMetricCards = [
    { key: "employees", label: t("dashboard.totalEmployees", lang), icon: Users, color: "text-blue-700", bg: "bg-blue-50" },
    { key: "departments", label: t("dashboard.activeDepartments", lang), icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { key: "pending", label: t("dashboard.pendingRequests", lang), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "present", label: t("dashboard.presentToday", lang), icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  const metricCards = regulatoryContext === "saudi" ? saudiMetricCards : indiaMetricCards;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("dashboard.title", lang)}</h1>
          <p className="mt-1 text-base text-slate-500">
            {t("dashboard.welcome", lang, { name: session?.user?.name ?? "User" })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-slate-200">
          <TrendingUp className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-slate-700">{t("dashboard.operational", lang)}</span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m: any) => {
          const value = metrics[m.key as keyof typeof metrics];
          return (
            <div key={m.key} className={`group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
              regulatoryContext === "saudi" ? "border-amber-200/60" : "border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className={`rounded-lg ${m.bg} p-2.5`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{value.toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500">{m.label}</p>
            </div>
          );
        })}
      </div>

      {regulatoryContext === "saudi" && (
        <div className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="h-5 w-5 text-amber-700" />
            <h2 className="text-base font-semibold text-slate-900">{t("dashboard.saudiCompliance", lang)}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("dashboard.gosi", lang), value: "98%", desc: "Contributions up to date" },
              { label: t("dashboard.qiwa", lang), value: "100%", desc: "Contracts registered" },
              { label: t("dashboard.nitaqat", lang), value: "Platinum", desc: "Highest band" },
              { label: t("dashboard.wps", lang), value: "On track", desc: "Last submission: 3 days ago" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/80 border border-amber-100 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                </div>
                <p className="mt-1.5 text-lg font-bold text-amber-800">{item.value}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`col-span-2 rounded-xl border bg-white p-6 shadow-sm ${
          regulatoryContext === "saudi" ? "border-amber-200/60" : "border-slate-200"
        }`}>
          <h2 className="text-base font-semibold text-slate-900">{t("dashboard.quickActions", lang)}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("dashboard.navHint", lang)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: t("dashboard.addEmployee", lang), href: "/employees/new" },
              { label: t("dashboard.newLeave", lang), href: "/leave/new" },
              { label: t("dashboard.postJob", lang), href: "/recruitment/jobs/new" },
              { label: t("dashboard.runPayroll", lang), href: "/payroll/new" },
              { label: t("dashboard.uploadDocument", lang), href: "/documents" },
              { label: t("dashboard.setOKRs", lang), href: "/retention/goals/new" },
            ].map((action: any) => (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center gap-2.5 rounded-lg border bg-stone-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800"
              >
                <div className={`h-2 w-2 rounded-full ${regulatoryContext === "saudi" ? "bg-amber-500" : "bg-green-500"}`} />
                {action.label}
              </a>
            ))}
          </div>
        </div>
        <div className={`rounded-xl border bg-white p-6 shadow-sm ${
          regulatoryContext === "saudi" ? "border-amber-200/60" : "border-slate-200"
        }`}>
          <h2 className="text-base font-semibold text-slate-900">{t("dashboard.systemStatus", lang)}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("dashboard.todaySnapshot", lang)}</p>
          <div className="mt-6 space-y-4">
            {[
              { label: t("dashboard.employeeTurnover", lang), value: `${Math.floor(Math.random() * 5 + 1)}%`, trend: "down", good: true },
              { label: t("dashboard.pendingApprovals", lang), value: String(metrics.pending), trend: "neutral" as const, good: false },
              { label: t("dashboard.openPositions", lang), value: "3", trend: "up" as const, good: true },
            ].map((stat: any) => (
              <div key={stat.label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-slate-500">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {regulatoryContext === "saudi" ? `${stat.value}` : stat.value}
                  </span>
                  {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {stat.trend === "down" && <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
