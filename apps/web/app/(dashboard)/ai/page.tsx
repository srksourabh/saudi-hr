"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from "@hrms-app/ui";
import { Brain, Lightbulb, TrendingDown, ShieldCheck, DollarSign, BookOpen, ListChecks, BarChart3 } from "lucide-react";

const modules = [
  {
    title: "AI Suggestions",
    description: "Recommendations and next-best HR actions",
    icon: Lightbulb,
    href: "/modules/ai-intelligence",
    status: "Preview",
  },
  {
    title: "Attrition Predictions",
    description: "Identify employees at risk of leaving",
    icon: TrendingDown,
    href: "/modules/ai-intelligence",
    status: "Preview",
  },
  {
    title: "Compliance Copilot",
    description: "Saudi labor-law answers with citations",
    icon: ShieldCheck,
    href: "/modules/nitaqat-compliance",
    status: "Preview",
  },
  {
    title: "Salary Benchmarks",
    description: "Market positioning and pay-equity insights",
    icon: DollarSign,
    href: "/modules/benefits-rewards",
    status: "Planned",
  },
  {
    title: "Skill Recommendations",
    description: "Skill-gap analysis and learning paths",
    icon: BookOpen,
    href: "/modules/learning-skills",
    status: "Preview",
  },
  {
    title: "People Analytics",
    description: "Retention, recruitment and compensation signals",
    icon: BarChart3,
    href: "/modules/people-analytics",
    status: "Planned",
  },
  {
    title: "AI Audit Trail",
    description: "Human approvals and AI action traceability",
    icon: ListChecks,
    href: "/modules/workflow-automation",
    status: "Planned",
  },
  {
    title: "Autonomous Assistants",
    description: "Configure governed multi-step HR agents",
    icon: Brain,
    href: "/modules/workflow-automation",
    status: "Planned",
  },
] as const;

export default function AiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Native Intelligence</h1>
        <p className="text-muted-foreground">AI-powered insights, predictions, and automation</p>
      </div>
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
