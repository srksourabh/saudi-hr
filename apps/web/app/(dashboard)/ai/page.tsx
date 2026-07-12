"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from "@hrms-app/ui";
import { Brain, Lightbulb, TrendingDown, ShieldCheck, DollarSign, BookOpen, ListChecks, BarChart3 } from "lucide-react";

const modules = [
  {
    title: "AI Suggestions",
    description: "View and manage AI-generated recommendations",
    icon: Lightbulb,
    href: "/ai/suggestions",
  },
  {
    title: "Churn Predictions",
    description: "Identify employees at risk of leaving",
    icon: TrendingDown,
    href: "/ai/churn",
  },
  {
    title: "Compliance Risk",
    description: "AI-powered compliance risk assessment",
    icon: ShieldCheck,
    href: "/ai/compliance",
  },
  {
    title: "Salary Benchmarks",
    description: "Market salary benchmarking data",
    icon: DollarSign,
    href: "/ai/salary",
  },
  {
    title: "Skill Recommendations",
    description: "AI skill gap analysis and learning paths",
    icon: BookOpen,
    href: "/ai/skills",
  },
  {
    title: "Retention Risk Flags",
    description: "Automatic retention risk indicators",
    icon: BarChart3,
    href: "/ai/retention",
  },
  {
    title: "Audit Log",
    description: "AI action audit trail",
    icon: ListChecks,
    href: "/ai/audit",
  },
  {
    title: "Assistants",
    description: "Configure AI assistants",
    icon: Brain,
    href: "/ai/assistants",
  },
];

export default function AiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Native Intelligence</h1>
        <p className="text-muted-foreground">AI-powered insights, predictions, and automation</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module: any) => (
          <Card key={module.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <module.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <Badge variant="secondary" className="ml-auto">Active</Badge>
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
