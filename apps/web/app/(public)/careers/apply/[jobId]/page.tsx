"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { SaudiBackdrop } from "~/components/saudi/saudi-backdrop";
import { BrandLockup } from "~/components/brand/brand-lockup";
import { ArrowLeft, CheckCircle2, FileText, Send, Upload } from "lucide-react";

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params?.jobId ?? "";

  const job = api.recruitment.jobRequisition.getById.useQuery(jobId);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "Saudi",
    currentLocation: "",
    yearsExperience: 0,
    currentEmployer: "",
    expectedSalary: 0,
    coverLetter: "",
  });
  const [submitted, setSubmitted] = useState<string | null>(null);

  const submitApplication = api.recruitment.application.create.useMutation({
    onSuccess: (result: any) => {
      setSubmitted(result?.id ?? "ok");
    },
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitApplication.mutate({
      jobRequisitionId: jobId,
      candidateId: `cand-${Date.now()}`,
      stage: "applied",
      coverLetter: form.coverLetter,
      notes: `${form.fullName} · ${form.phone} · ${form.nationality} · ${form.yearsExperience}y exp · expected SAR ${form.expectedSalary}`,
    } as any);
  }

  if (job.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!job.data) {
    return (
      <div className="relative min-h-screen w-full">
        <SaudiBackdrop variant="riyadh" dim className="absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-2xl px-6 py-20">
          <BrandLockup inverse priority />
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Job not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                This role may have been filled or removed. Browse other open positions.
              </p>
              <Link
                href="/careers"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <ArrowLeft className="h-4 w-4 rtl-flip" /> Back to careers
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen w-full">
        <SaudiBackdrop variant="riyadh" dim className="absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-2xl px-6 py-20">
          <BrandLockup inverse priority />
          <Card className="mt-12">
            <CardContent className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-950">Application submitted</h2>
              <p className="text-sm text-slate-600">
                Thank you for applying to <strong>{job.data.title}</strong>. Our talent team will review your profile and reach out within 5 business days.
              </p>
              <p className="font-mono text-xs text-slate-400">Reference: {submitted}</p>
              <div className="flex justify-center gap-2">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  View more roles
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      <SaudiBackdrop variant="riyadh" dim className="absolute inset-0" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <BrandLockup inverse priority />
        <Link
          href="/careers"
          className="text-sm font-medium text-white/85 hover:text-white"
        >
          ← Back to careers
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-20 sm:px-10">
        <Card className="mt-10">
          <CardHeader className="border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Apply now · Taāzur careers
            </p>
            <CardTitle className="mt-2 text-2xl">{job.data.title}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>📍 {job.data.location ?? "Riyadh"}</span>
              <span>·</span>
              <span>{String(job.data.type ?? "full_time").replace("_", " ")}</span>
              {job.data.minSalary && job.data.maxSalary && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-emerald-700">
                    SAR {job.data.minSalary.toLocaleString()} – {job.data.maxSalary.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+966 5X XXX XXXX"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={form.nationality}
                    onChange={(e) => update("nationality", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currentLocation">Current location</Label>
                  <Input
                    id="currentLocation"
                    value={form.currentLocation}
                    onChange={(e) => update("currentLocation", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yearsExperience">Years of experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min={0}
                    value={form.yearsExperience}
                    onChange={(e) => update("yearsExperience", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currentEmployer">Current employer</Label>
                  <Input
                    id="currentEmployer"
                    value={form.currentEmployer}
                    onChange={(e) => update("currentEmployer", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expectedSalary">Expected salary (SAR / month)</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    min={0}
                    step={500}
                    value={form.expectedSalary}
                    onChange={(e) => update("expectedSalary", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coverLetter">Cover letter</Label>
                <Textarea
                  id="coverLetter"
                  rows={4}
                  placeholder="Tell us why you are interested in this role…"
                  value={form.coverLetter}
                  onChange={(e) => update("coverLetter", e.target.value)}
                />
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700">CV / Resume</p>
                    <p className="text-xs text-slate-500">
                      Production: PDF upload via signed URL. Demo: HR team will request CV by email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  By submitting you agree to Rukn Energy processing your data per PDPL.
                </p>
                <Button
                  type="submit"
                  disabled={submitApplication.isPending || !form.fullName || !form.email || !form.phone}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitApplication.isPending ? "Submitting…" : "Submit application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center gap-2 text-xs text-white/70">
          <FileText className="h-3.5 w-3.5" />
          All applications are reviewed by HR within 5 business days.
        </div>
      </main>
    </div>
  );
}