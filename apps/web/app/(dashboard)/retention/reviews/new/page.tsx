"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hrms-app/ui";
import { SaudiPalmette } from "~/components/saudi/saudi-backdrop";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function RetentionReviewsNewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/retention/reviews"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[hsl(var(--saudi-green))]"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to Reviews
      </Link>

      <Card className="saudi-card overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-amber-50 via-white to-emerald-50/40 pb-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--saudi-gold))] to-amber-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Retention Reviews — New</CardTitle>
          <CardDescription>Create a new reviews in your company.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-center">
          <SaudiPalmette className="mx-auto h-4 w-32 text-[hsl(var(--saudi-gold))]" />
          <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 p-4 text-sm text-amber-900">
            <p>
              <strong>Phase 2+ feature.</strong> The create flow for this
              resource is part of our Phase 2 (employee lifecycle) or later
              rollout. The list view and read paths are already live and
              working.
            </p>
            <p className="mt-2 text-xs text-amber-800/80">
              Need this now? Use the list view&apos;s &ldquo;Create&rdquo; action
              once Phase A of the rollout ships.
            </p>
          </div>
          <Link
            href="/retention/reviews"
            className="saudi-gradient-primary inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Go to Reviews
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
