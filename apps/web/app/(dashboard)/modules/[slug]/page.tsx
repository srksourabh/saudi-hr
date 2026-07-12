import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  getProductModule,
  moduleStatusLabels,
  productModules,
} from "~/lib/module-catalog";

export function generateStaticParams() {
  return productModules.map((productModule) => ({ slug: productModule.slug }));
}

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productModule = getProductModule(slug);

  if (!productModule) notFound();

  const statusClass =
    productModule.status === "available"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
      : productModule.status === "preview"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border-white/15 bg-white/5 text-white/70";

  return (
    <div className="space-y-6">
      <Link href="/modules" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-800">
        <ArrowLeft className="h-4 w-4" />
        All modules
      </Link>

      <section className="relative overflow-hidden rounded-[30px] bg-[#071b14] p-7 text-white sm:p-10">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_88%_8%,rgba(245,183,48,.3),transparent_25%),radial-gradient(circle_at_8%_90%,rgba(34,197,94,.25),transparent_30%)]" />
        <div className="relative max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Phase {productModule.phase} · {productModule.eyebrow}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
              {moduleStatusLabels[productModule.status]}
            </span>
          </div>
          <h1 className="mt-7 max-w-3xl text-4xl font-medium tracking-[-0.045em] sm:text-6xl">
            {productModule.name}
          </h1>
          <p className="mt-2 text-xl text-amber-300" dir="rtl">{productModule.nameAr}</p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/65">{productModule.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {productModule.href ? (
              <Link href={productModule.href} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100">
                Open workspace
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/75">
                <Clock3 className="h-4 w-4" />
                Scheduled in product plan
              </span>
            )}
            <Link href="/modules" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Browse related modules
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Capability scope</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {productModule.capabilities.map((capability) => (
              <div key={capability} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-sm font-medium leading-5 text-slate-700">{capability}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-[#f6f5f1] p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-800" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">PRD traceability</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            This workspace maps directly to the following UDS-HR PRD v5.0 feature IDs.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {productModule.featureIds.map((featureId) => (
              <span key={featureId} className="rounded-full border border-emerald-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900">
                Feature {featureId}
              </span>
            ))}
          </div>
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Delivery status</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {productModule.status === "available"
                ? "A navigable product workspace exists in this build. Individual workflows may still depend on tenant data or external credentials."
                : productModule.status === "preview"
                  ? "The workspace or related screens exist, but the full PRD acceptance criteria are not yet complete."
                  : "This capability is visible for planning and traceability but is not represented as production-complete."}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
