"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from "@hrms-app/ui";
import { Target, ClipboardList, BookOpen, TrendingUp, Heart, DollarSign, Users } from "lucide-react";

const modules = [
  {
    title: "Goals & OKRs",
    description: "Set and track employee goals and key results",
    icon: Target,
    href: "/retention/goals",
  },
  {
    title: "Performance Reviews",
    description: "Manage performance review cycles and feedback",
    icon: ClipboardList,
    href: "/retention/reviews",
  },
  {
    title: "Skills & Learning",
    description: "Track skills development and learning progress",
    icon: BookOpen,
    href: "/retention/skills",
  },
  {
    title: "Career & Succession",
    description: "Plan career paths and succession pipelines",
    icon: TrendingUp,
    href: "/retention/career",
  },
  {
    title: "Engagement & Recognition",
    description: "Foster employee engagement and recognize achievements",
    icon: Heart,
    href: "/retention/engagement",
  },
  {
    title: "Compensation & Rewards",
    description: "Manage compensation plans and reward programs",
    icon: DollarSign,
    href: "/retention/rewards",
  },
  {
    title: "Talent Reviews",
    description: "Conduct talent reviews and identify high potentials",
    icon: Users,
    href: "/retention/talent",
  },
];

export default function RetentionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Retention & Growth</h1>
        <p className="text-muted-foreground">Employee retention, development, and engagement</p>
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
