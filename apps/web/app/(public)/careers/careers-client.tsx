"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import { SaudiBackdrop, SaudiPalmette } from "~/components/saudi/saudi-backdrop";
import { BrandLockup } from "~/components/brand/brand-lockup";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Globe2,
  MapPin,
  Sparkles,
} from "lucide-react";

export function CareersClient() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const jobs = api.recruitment.jobRequisition.list.useQuery({ status: "open" });
  const departments = api.department.list.useQuery();

  const isAr = language === "ar";
  const openJobs = jobs.data?.items ?? [];
  const deptList = departments.data?.items ?? [];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="relative min-h-screen w-full">
      <SaudiBackdrop variant="riyadh" dim className="absolute inset-0" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <BrandLockup inverse priority />
        <div className="flex items-center gap-2 text-sm text-white/80">
          <button
            type="button"
            onClick={() => setLanguage("ar")}
            className={`rounded-full px-3 py-1 transition ${isAr ? "bg-white/15 text-white" : "hover:bg-white/10"}`}
          >
            العربية
          </button>
          <span className="opacity-50">|</span>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded-full px-3 py-1 transition ${!isAr ? "bg-white/15 text-white" : "hover:bg-white/10"}`}
          >
            EN
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-10">
        <section className="text-white">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[hsl(var(--saudi-gold))]">
            Rukn Energy Services · Careers
          </p>
          <h1 className="mb-4 max-w-3xl text-5xl font-bold leading-tight tracking-tight">
            {isAr
              ? "انضم إلى فريق يقود تحول الطاقة في المملكة"
              : "Join the team powering Saudi Arabia's energy transition"}
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/85">
            {isAr
              ? "نبحث عن موظفين ملتزمين يشاركوننا مهمة تقديم حلول طاقة آمنة ومستدامة عبر المملكة. استكشف الوظائف المتاحة وقدم طلبك خلال دقائق."
              : "We are hiring committed professionals who share our mission of delivering safe, sustainable energy across the Kingdom. Browse open roles and apply in minutes."}
          </p>
          <SaudiPalmette className="mb-8 h-5 w-40 text-[hsl(var(--saudi-gold))]" />
          <div className="grid max-w-3xl grid-cols-3 gap-6">
            <div className="text-white/90">
              <p className="text-2xl font-semibold">{openJobs.length}</p>
              <p className="text-xs uppercase tracking-wider text-white/60">
                {isAr ? "وظائف شاغرة" : "Open roles"}
              </p>
            </div>
            <div className="text-white/90">
              <p className="text-2xl font-semibold">{deptList.length}</p>
              <p className="text-xs uppercase tracking-wider text-white/60">
                {isAr ? "أقسام" : "Departments"}
              </p>
            </div>
            <div className="text-white/90">
              <p className="text-2xl font-semibold">3</p>
              <p className="text-xs uppercase tracking-wider text-white/60">
                {isAr ? "فروع" : "Branches"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[24px] border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">
              {isAr ? "الوظائف المتاحة" : "Open positions"}
            </h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {isAr ? "تحديث لحظي" : "Live updates"}
            </span>
          </div>

          {jobs.isLoading ? (
            <p className="text-sm text-slate-500">
              {isAr ? "جاري تحميل الوظائف..." : "Loading open positions..."}
            </p>
          ) : !openJobs || openJobs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <Briefcase className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                {isAr ? "لا توجد وظائف شاغرة حالياً" : "No open positions right now"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isAr
                  ? "سجّل اهتمامك وسنتواصل معك عند توفر فرصة مناسبة."
                  : "Submit your interest and we will reach out when a matching role opens."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {openJobs.map((job: any) => {
                const dept = deptList.find((d: any) => d.id === job.departmentId);
                return (
                  <Link
                    key={job.id}
                    href={`/careers/apply/${job.id}`}
                    className="group flex items-start justify-between gap-4 py-5 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {String(job.type ?? "full_time").replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        {dept && (
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {dept.name}
                          </span>
                        )}
                        {job.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="inline-flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5" />
                            {isAr ? "عمل عن بُعد" : "Remote-friendly"}
                          </span>
                        )}
                        {(job.minSalary || job.maxSalary) && (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                            SAR {(job.minSalary ?? 0).toLocaleString()} – {(job.maxSalary ?? 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700 rtl-flip" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { title: isAr ? "تأمين طبي شامل" : "Comprehensive medical", body: isAr ? "تغطية طبية للموظف وعائلته عبر CCHI" : "CCHI-aligned coverage for employee and family" },
            { title: isAr ? "إجازات سخية" : "Generous leave", body: isAr ? "21-30 يوم إجازة سنوية + تذاكر سفر" : "21–30 day annual leave + travel tickets" },
            { title: isAr ? "نمو مهني" : "Career growth", body: isAr ? "خطط تعلم ومسارات وظيفية واضحة" : "Learning plans and structured career paths" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-6 text-white backdrop-blur">
              <Sparkles className="mb-3 h-5 w-5 text-[hsl(var(--saudi-gold))]" />
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-white/70">{item.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-4 text-center text-xs text-white/60 sm:px-10">
        Rukn Energy Services · CR 1010987654 · powered by Taāzur
      </footer>
    </div>
  );
}
