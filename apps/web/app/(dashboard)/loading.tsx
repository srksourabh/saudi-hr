export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-2.5 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-7">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-9 w-72 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-96 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-2 pt-2">
              <div className="h-9 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="h-9 w-32 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="col-span-2 h-20 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-5 h-7 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}