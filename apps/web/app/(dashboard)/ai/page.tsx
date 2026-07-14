"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from "@hrms-app/ui";
import {
  Brain,
  Lightbulb,
  TrendingDown,
  ShieldCheck,
  DollarSign,
  BookOpen,
  ListChecks,
  BarChart3,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const modules = [
  {
    title: "AI Suggestions",
    description: "Recommendations and next-best HR actions",
    icon: Lightbulb,
    href: "/modules/ai-intelligence",
    status: "Operational demo",
  },
  {
    title: "Attrition Predictions",
    description: "Identify employees at risk of leaving",
    icon: TrendingDown,
    href: "/modules/ai-intelligence",
    status: "Operational demo",
  },
  {
    title: "Compliance Copilot",
    description: "Saudi labor-law answers with citations",
    icon: ShieldCheck,
    href: "/modules/nitaqat-compliance",
    status: "Operational demo",
  },
  {
    title: "Salary Benchmarks",
    description: "Market positioning and pay-equity insights",
    icon: DollarSign,
    href: "/modules/benefits-rewards",
    status: "Operational demo",
  },
  {
    title: "Skill Recommendations",
    description: "Skill-gap analysis and learning paths",
    icon: BookOpen,
    href: "/modules/learning-skills",
    status: "Operational demo",
  },
  {
    title: "People Analytics",
    description: "Retention, recruitment and compensation signals",
    icon: BarChart3,
    href: "/modules/people-analytics",
    status: "Operational demo",
  },
  {
    title: "AI Audit Trail",
    description: "Human approvals and AI action traceability",
    icon: ListChecks,
    href: "/modules/workflow-automation",
    status: "Operational demo",
  },
  {
    title: "Autonomous Assistants",
    description: "Configure governed multi-step HR agents",
    icon: Brain,
    href: "/modules/workflow-automation",
    status: "Operational demo",
  },
] as const;

export default function AiPage() {
  return (
    <div className="space-y-6">
      {/* Hero CTA — open the native chat */}
      <section className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl">AI-Native Intelligence</h1>
              <p className="mt-1 text-sm text-slate-600">
                Ask Taāzur AI anything about Saudi HR & payroll — it answers in your language with citations to GOSI, Mudad, Qiwa, and the Saudi Labour Law.
              </p>
            </div>
          </div>
          <Link
            href="/ai-chat"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            <Sparkles className="h-4 w-4" /> Open Taāzur AI Chat <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <module.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <Badge variant="secondary" className="ml-auto">{module.status}</Badge>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={module.href}>View</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}