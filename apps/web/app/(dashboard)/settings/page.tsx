"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRegulatoryContext } from "~/lib/regulatory-context";
import { t } from "~/lib/i18n";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { regulatoryContext, preferredLanguage: lang } = useRegulatoryContext();
  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");

  const borderStyle = regulatoryContext === "saudi" ? "border-amber-200/60" : "border-slate-200";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("nav.settings", lang)}</h1>
        <p className="mt-1 text-base text-slate-500">Manage your account settings and preferences</p>
      </div>

      <Card className={`rounded-xl border bg-white p-6 shadow-sm ${borderStyle}`}>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input value={user?.email ?? ""} disabled placeholder="Email address" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <Input value={user?.role ?? ""} disabled placeholder="Role" />
          </div>
        </CardContent>
        <CardFooter className="px-0 pb-0">
          <Button onClick={() => alert("Saved")}>{t("common.save", lang)}</Button>
        </CardFooter>
      </Card>

      <Card className={`rounded-xl border bg-white p-6 shadow-sm ${borderStyle}`}>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Account</CardTitle>
          <CardDescription>Language and regional preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Preferred Language</p>
              <p className="text-xs text-slate-500">Can be changed in the header dropdown</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 uppercase">{lang}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Regulatory Context</p>
              <p className="text-xs text-slate-500">Labour law framework for your company</p>
            </div>
            <span className="text-sm font-semibold text-slate-700 capitalize">{regulatoryContext}</span>
          </div>
        </CardContent>
      </Card>

      <Card className={`rounded-xl border bg-white p-6 shadow-sm ${borderStyle}`}>
        <CardHeader className="px-0 pt-0">
          <CardTitle>Tenant Info</CardTitle>
          <CardDescription>Your organisation details (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Tenant ID</p>
            <code className="text-sm font-mono text-slate-600">{user?.tenantId}</code>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Role</p>
            <span className="text-sm font-semibold text-slate-700 capitalize">{user?.role?.replace("_", " ")}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-stone-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">Regulatory Context</p>
            <span className="text-sm font-semibold text-slate-700 capitalize">{regulatoryContext}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
