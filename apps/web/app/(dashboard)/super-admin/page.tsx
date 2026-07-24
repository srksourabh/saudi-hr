"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Globe2,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

interface TenantRow {
  id: string;
  name: string;
  crNumber: string | null;
  nitaqatActivity: string | null;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  logoUrl: string | null;
  regulatoryContext: string;
  createdAt: string | Date;
}

const initialForm = {
  companyName: "",
  logoUrl: "",
  crNumber: "",
  nitaqatActivity: "general",
  industry: "",
  companySize: "",
  website: "",
  email: "",
  name: "",
  password: "",
  regulatoryContext: "saudi" as const,
};

const fieldInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600";

export default function SuperAdminPage() {
  const session = api.auth.session.useQuery();
  const list = api.auth.tenantsList.useQuery(undefined, { retry: false });
  const [formData, setFormData] = useState(initialForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdAdmin, setCreatedAdmin] = useState<string | null>(null);

  const createMutation = api.auth.createCompany.useMutation({
    onSuccess: (result) => {
      setCreatedAdmin(result.adminUser);
      setCreateError(null);
      setFormData(initialForm);
      list.refetch();
    },
    onError: (err) => {
      setCreatedAdmin(null);
      setCreateError(err.message);
    },
  });

  if (session.isLoading || list.isLoading) {
    return (
      <div className="flex items-center gap-2 p-12 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading platform console...
      </div>
    );
  }

  if (list.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <AlertTriangle className="h-5 w-5" />
        <h1 className="mt-2 text-lg font-semibold">Platform superadmin access required</h1>
        <p className="mt-1 text-sm">{list.error.message}</p>
        <p className="mt-3 text-xs text-rose-700">
          Sign in with the platform superadmin email configured for this installation.
        </p>
      </div>
    );
  }

  const data = list.data as { tenants: TenantRow[] } | undefined;
  const tenants = data?.tenants ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-slate-950 px-6 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
          Taazur platform superadmin
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Company provisioning</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              This account is only for creating new Saudi company workspaces. Each company starts with a blank isolated tenant schema and its own company admin.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Companies" value={tenants.length} icon={Building2} />
            <Stat label="Mode" value="Saudi" icon={ShieldCheck} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Create a new company</h2>
              <p className="text-sm text-slate-500">Basic Saudi setup now; HR can update details later in Company Settings.</p>
            </div>
          </div>

          {createError && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {createError}
            </div>
          )}
          {createdAdmin && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> Company created. Admin login: {createdAdmin}
            </div>
          )}

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setCreateError(null);
              setCreatedAdmin(null);
              createMutation.mutate(formData);
            }}
          >
            <Field label="Company name" required>
              <input
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Al Rawabi Contracting"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Company logo URL">
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://company.sa/logo.png"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Commercial registration" required>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{10}"
                value={formData.crNumber}
                onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                placeholder="1010123456"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Nitaqat activity">
              <input
                value={formData.nitaqatActivity}
                onChange={(e) => setFormData({ ...formData, nitaqatActivity: e.target.value })}
                placeholder="construction"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Industry">
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">Select industry</option>
                <option value="construction">Construction & Engineering</option>
                <option value="oil_and_gas">Oil & Gas / Energy</option>
                <option value="retail">Retail & Consumer</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance & Banking</option>
                <option value="it">Information Technology</option>
                <option value="logistics">Logistics & Transport</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Company size">
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className={fieldInputClass}
              >
                <option value="">Select headcount</option>
                <option value="1-10">1 - 10 employees</option>
                <option value="11-50">11 - 50 employees</option>
                <option value="51-200">51 - 200 employees</option>
                <option value="201-500">201 - 500 employees</option>
                <option value="501-1000">501 - 1,000 employees</option>
                <option value="1000+">Over 1,000 employees</option>
              </select>
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://company.sa"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Company admin name" required>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company Admin"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Company admin email" required>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@company.sa"
                className={fieldInputClass}
              />
            </Field>
            <Field label="Company admin password" required>
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Strong password"
                className={fieldInputClass}
              />
            </Field>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                The new company schema is blank. The company admin and HR create departments, designations, and employees inside that workspace.
              </p>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create company
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recently provisioned</h2>
          <div className="mt-4 space-y-3">
            {tenants.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No companies yet.</p>
            ) : (
              tenants.slice(0, 8).map((tenant) => (
                <div key={tenant.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                      {tenant.logoUrl ? <ImageIcon className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{tenant.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">CR {tenant.crNumber ?? "-"} · {tenant.regulatoryContext}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[tenant.industry, tenant.companySize, tenant.nitaqatActivity].filter(Boolean).join(" · ") || "Basic profile pending"}
                      </p>
                      {tenant.website && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                          <Globe2 className="h-3 w-3" /> {tenant.website}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Building2 }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-emerald-300" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/50">{label}</p>
          <p className="text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
