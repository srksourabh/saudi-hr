"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { DemoWorkflow } from "@hrms-app/demo";
import type { ProductModule } from "~/lib/module-catalog";
import { ProductionConnector } from "./production-connector";

interface OperationalModuleWorkspaceProps {
  module: ProductModule;
  workflow: DemoWorkflow;
  userName: string;
}

const INTEGRATION_SLUGS = new Set([
  "government-integrations",
  "qiwa",
]);

export function OperationalModuleWorkspace({ module, workflow, userName }: OperationalModuleWorkspaceProps) {
  const initialRecords = useMemo(() => workflow.records, [workflow.records]);
  const showConnectorPattern = INTEGRATION_SLUGS.has(module.slug) || workflow.mode === "mock";

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white px-6 py-7 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{module.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{workflow.title}</h1>
            <p className="mt-1 text-sm text-slate-500" dir="rtl">{module.nameAr}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{workflow.summary}</p>
            <p className="mt-3 text-xs text-slate-400">
              Last refreshed by {userName} · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          {module.href && (
            <Link href={module.href} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900">
              Open workspace <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {workflow.metrics.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
            <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
          </article>
        ))}
      </section>

      {showConnectorPattern && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Production connectors</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Authority &amp; vendor integrations</h2>
            <p className="mt-1 text-sm text-slate-500">
              Each connector below runs as a deterministic simulation in the customer demo. To go live,
              set the listed environment variables and complete the configuration checklist.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {CONNECTORS_BY_SLUG[module.slug]?.map((c) => (
              <ProductionConnector key={c.id} {...c} />
            ))}
            {!CONNECTORS_BY_SLUG[module.slug]?.length && (
              <p className="text-sm text-slate-500">No connectors configured for this workspace.</p>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Workspace records</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Current items</h2>
          </div>
          <div className="flex items-center gap-2">
            {module.href && (
              <Link href={module.href} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                View all <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Live data
            </span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {initialRecords.map((item, idx) => (
            <div key={`${item.title}-${idx}`} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">{item.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Capabilities</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {module.capabilities.map((capability) => (
              <span key={capability} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                {capability}
              </span>
            ))}
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Available actions</p>
          <div className="mt-4 space-y-2">
            {workflow.actions.map((action) => (
              <Link
                key={action.id}
                href={module.href ?? "/"}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{action.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{action.result}</span>
                </span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

// Connector catalog keyed by workspace slug. Production rollout only requires
// setting the env vars and completing the checklist — the adapters behind each
// connector swap from deterministic mock to live provider without code change.
const CONNECTORS_BY_SLUG: Record<string, Array<React.ComponentProps<typeof ProductionConnector>>> = {
  "government-integrations": [
    {
      id: "qiwa",
      name: "Qiwa · Ministry of Labor",
      purpose: "Contract creation, amendments, transfers, residence permits via MOL.",
      category: "authority",
      docsUrl: "https://www.qiwa.sa/",
      envVars: ["QIWA_API_KEY", "QIWA_CLIENT_ID", "QIWA_CLIENT_SECRET", "QIWA_ENVIRONMENT"],
      checklist: [
        "MOL issued the production Qiwa API client_id and client_secret",
        "Taāzur CR registered as the requesting establishment in Qiwa",
        "Webhook endpoint /api/integrations/qiwa/webhook publicly reachable and signature-verified",
        "Field mapping (job title → MOL occupation code) reviewed by HR Ops",
        "Sandbox run completed end-to-end before flipping QIWA_ENVIRONMENT=production",
      ],
      demoActionLabel: "Sync a contract amendment to Qiwa (mock)",
      demoResult:
        '{ "reference":"QIW-DEMO-2026-0001", "status":"submitted", "establishment":"1010987654", "etag":"W/\\\"mock\\\"", "receivedAt":"2026-07-13T10:00:00Z" }',
      badges: ["MOL", "REST"],
    },
    {
      id: "mudad",
      name: "Mudad · Wage Protection System",
      purpose: "WPS-compliant wage file generation and direct submission.",
      category: "authority",
      docsUrl: "https://mudad.gov.sa/",
      envVars: ["MUDAD_API_KEY", "MUDAD_ESTABLISHMENT_ID", "MUDAD_ENVIRONMENT"],
      checklist: [
        "Mudad establishment ID issued by SAMA",
        "Bank routing for the salary file (SIF) confirmed with the bank",
        "All employee IBANs validated against the Saudi IBAN format",
        "Test submission accepted in sandbox (status: approved)",
        "Production submitter (signing officer) authorised in Mudad portal",
      ],
      demoActionLabel: "Generate June 2026 wage file (mock)",
      demoResult:
        '{ "fileId":"MUD-WPS-2026-06", "rows":12, "total":"SAR 325,440.00", "status":"validated", "sha256":"mock-checksum" }',
      badges: ["SAMA", "WPS"],
    },
    {
      id: "gosi",
      name: "GOSI · General Organization for Social Insurance",
      purpose: "Salary change notifications, monthly contribution reconciliation.",
      category: "authority",
      docsUrl: "https://www.gosi.gov.sa/",
      envVars: ["GOSI_API_KEY", "GOSI_SUBSCRIBER_NUMBER", "GOSI_ENVIRONMENT"],
      checklist: [
        "GOSI subscriber number (700xxxxxxx) confirmed",
        "Cohort mapping (legacy 9.75 / new-entrant 10.75 / expat hazards-only 0) validated by Saudi legal counsel",
        "Run submitted in sandbox within the 15-day window",
        "Reconciliation report archived per Section 10 retention policy",
      ],
      demoActionLabel: "Notify GOSI of June 2026 contribution (mock)",
      demoResult:
        '{ "reference":"GOS-CONTRIB-2026-06", "rows":12, "employeeTotal":"SAR 19,420.00", "employerTotal":"SAR 25,800.00", "submittedAt":"2026-06-30T14:00:00Z" }',
      badges: ["GOSI"],
    },
    {
      id: "muqeem",
      name: "Muqeem · Resident identity",
      purpose: "Iqama renewal, exit/re-entry permit, final-exit evidence.",
      category: "authority",
      envVars: ["MUQEEM_API_KEY", "MUQEEM_ESTABLISHMENT_ID"],
      checklist: [
        "Establishment ID issued by Muqeem",
        "Resident identity numbers (Iqama) populated on every expat record",
        "Renewal window alerts wired into the document-expiry agent",
      ],
      demoActionLabel: "Validate an Iqama expiry (mock)",
      demoResult:
        '{ "iqama":"2XX-XXX-XXXX", "expiresOn":"2026-09-12", "statusEligible":"yes", "renewalWindowOpens":"2026-06-14" }',
    },
    {
      id: "zatca",
      name: "ZATCA · E-invoicing",
      purpose: "Phase 2 e-invoicing compliance for contractor payments.",
      category: "authority",
      envVars: ["ZATCA_CSR", "ZATCA_PRIVATE_KEY", "ZATCA_ENVIRONMENT"],
      checklist: [
        "ZATCA-issued CSR and private key stored in the secrets vault",
        "Solution registered with ZATCA's Fatoora portal",
        "Invoice hash chain and counter signed per Phase 2 spec",
      ],
      demoActionLabel: "Sign a contractor invoice (mock)",
      demoResult:
        '{ "invoiceId":"INV-2026-0001", "hash":"mock-hash", "clearedAt":"2026-07-13T10:05:00Z", "counter":42 }',
    },
    {
      id: "bank",
      name: "Bank payroll file (SIF)",
      purpose: "Saudi Interbank File generation for Al Rajhi, SNB, Riyad Bank.",
      category: "banking",
      envVars: ["BANK_NAME", "BANK_SFTP_HOST", "BANK_SFTP_USER", "BANK_SFTP_KEY"],
      checklist: [
        "Bank SFTP credentials issued by the chosen bank",
        "SIF format version reviewed with the bank (currently v2.1)",
        "Test file submitted and accepted by the bank",
      ],
      demoActionLabel: "Generate June 2026 SIF (mock)",
      demoResult:
        '{ "fileId":"BNK-SIF-2026-06", "rows":12, "total":"SAR 325,440.00", "format":"SIF-v2.1" }',
      badges: ["Al Rajhi", "SNB", "Riyad"],
    },
  ],
  qiwa: [
    {
      id: "qiwa",
      name: "Qiwa · Ministry of Labor",
      purpose: "Contract creation, amendments, transfers, residence permits via MOL.",
      category: "authority",
      docsUrl: "https://www.qiwa.sa/",
      envVars: ["QIWA_API_KEY", "QIWA_CLIENT_ID", "QIWA_CLIENT_SECRET", "QIWA_ENVIRONMENT"],
      checklist: [
        "MOL issued the production Qiwa API client_id and client_secret",
        "Taāzur CR registered as the requesting establishment in Qiwa",
        "Webhook endpoint /api/integrations/qiwa/webhook publicly reachable and signature-verified",
        "Field mapping (job title → MOL occupation code) reviewed by HR Ops",
      ],
      demoActionLabel: "Push contract amendment (mock)",
      demoResult:
        '{ "reference":"QIW-DEMO-2026-0002", "status":"submitted", "etag":"W/\\\"mock\\\"", "receivedAt":"2026-07-13T10:00:00Z" }',
    },
  ],
};