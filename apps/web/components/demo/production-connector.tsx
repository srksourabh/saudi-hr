"use client";

/**
 * Production Connector — a reusable production-ready placeholder card for
 * adapters that are deterministic simulations in the customer demo.
 *
 * For each authority / vendor integration the demo shows:
 *   1. the connector role (what it does in production)
 *   2. the API key / credential slot — never a real secret in code
 *   3. the environment badge (sandbox / staging / production)
 *   4. the configuration checklist that must be completed by HR Ops
 *      before going live
 *   5. a deterministic mock action the customer can click to see the
 *      simulated response
 *
 * The component does NOT make outbound calls. The real provider adapter is
 * a thin drop-in replacement behind the same interface — when the env vars
 * listed in `envVars` are set, the integration switches to live mode.
 */

import { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type ConnectorCategory = "authority" | "banking" | "saas" | "internal";

export interface ProductionConnectorProps {
  /** Stable identifier, e.g. "qiwa", "mudad", "gosi", "muqeem", "zatca", "al_rajhi" */
  id: string;
  /** Display name, e.g. "Qiwa · Ministry of Labor" */
  name: string;
  /** One-line purpose */
  purpose: string;
  /** Longer description shown when expanded */
  description?: string;
  category: ConnectorCategory;
  /** Vendor docs / sandbox URL */
  docsUrl?: string;
  /** Environment variable names whose presence flips the connector to live mode */
  envVars: string[];
  /** Configuration checklist (each item shown with a checkbox the HR admin can tick) */
  checklist: string[];
  /** Demo action label + deterministic result the customer sees on click */
  demoActionLabel: string;
  demoResult: string;
  /** Optional extra badges */
  badges?: string[];
}

const categoryLabels: Record<ConnectorCategory, string> = {
  authority: "Saudi authority",
  banking: "Banking",
  saas: "SaaS / productivity",
  internal: "Internal",
};

const categoryTone: Record<ConnectorCategory, string> = {
  authority: "bg-amber-50 text-amber-900 border-amber-200",
  banking: "bg-sky-50 text-sky-900 border-sky-200",
  saas: "bg-violet-50 text-violet-900 border-violet-200",
  internal: "bg-slate-50 text-slate-900 border-slate-200",
};

export function ProductionConnector(props: ProductionConnectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionRan, setActionRan] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(props.checklist.map(() => false));
  const [copied, setCopied] = useState<string | null>(null);

  function toggleCheck(idx: number) {
    setChecklist((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  function runDemo() {
    setActionRan(true);
    // In production, this becomes the real adapter call.
    // The shape of `props.demoResult` is preserved by the live adapter so
    // downstream UI does not need to change.
    setTimeout(() => setActionRan(false), 2200);
  }

  function copyEnvVar(name: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(name).then(() => {
        setCopied(name);
        setTimeout(() => setCopied(null), 1500);
      });
    }
  }

  const checkedCount = checklist.filter(Boolean).length;
  const checklistComplete = checkedCount === checklist.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${categoryTone[props.category]}`}>
            <Plug className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{props.name}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryTone[props.category]}`}>
                {categoryLabels[props.category]}
              </span>
              {props.badges?.map((b) => (
                <span key={b} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {b}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">{props.purpose}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {props.docsUrl && (
            <a
              href={props.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3 w-3" /> Docs
            </a>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Settings className="h-3 w-3" /> {expanded ? "Hide setup" : "Configure"}
          </button>
        </div>
      </header>

      {/* Always-visible: demo action */}
      <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer demo action</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{props.demoActionLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            Deterministic simulation — no outbound call. Same response shape that the live adapter returns.
          </p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={runDemo}
            disabled={actionRan}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-60 sm:w-auto"
          >
            {actionRan ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Response received
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Run simulation
              </>
            )}
          </button>
        </div>
      </div>

      {actionRan && (
        <div className="mx-5 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Mock response</p>
          <p className="mt-1 font-mono text-xs leading-6 text-emerald-900">{props.demoResult}</p>
        </div>
      )}

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          {props.description && <p className="text-sm text-slate-600">{props.description}</p>}

          {/* Environment variables */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <KeyRound className="h-3.5 w-3.5" /> Environment variables &amp; credentials
            </div>
            <div className="space-y-1.5">
              {props.envVars.map((name) => (
                <div key={name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <code className="font-mono text-xs text-slate-700">{name}</code>
                  <button
                    type="button"
                    onClick={() => copyEnvVar(name)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {copied === name ? (
                      <>
                        <Check className="h-3 w-3" /> copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Set these in your deployment environment (Vercel, AWS, on-prem). The connector automatically
                switches from deterministic mock to live provider when the variable is present and non-empty.
                No code change required.
              </span>
            </p>
          </div>

          {/* Configuration checklist */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Production go-live checklist
              </span>
              <span className={checklistComplete ? "text-emerald-700" : "text-slate-400"}>
                {checkedCount} / {checklist.length} complete
              </span>
            </div>
            <ul className="space-y-1.5">
              {props.checklist.map((item, idx) => (
                <li key={item}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={checklist[idx]}
                      onChange={() => toggleCheck(idx)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={checklist[idx] ? "text-slate-400 line-through" : "text-slate-700"}>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-slate-400">
            Connector ID: <code className="font-mono">{props.id}</code> · This panel renders inside the
            demo wrapper so HR Ops can see exactly what production rollout requires.
          </p>
        </div>
      )}
    </article>
  );
}