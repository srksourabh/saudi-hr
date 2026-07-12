"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Badge } from "@hrms-app/ui";
import { Briefcase, Users, FileText, CalendarCheck, FileCheck, Award, UserPlus, ClipboardCheck } from "lucide-react";

const modules = [
  {
    title: "Job Requisitions",
    description: "Create and manage job postings and approvals",
    icon: Briefcase,
    href: "/recruitment/jobs",
  },
  {
    title: "Candidates",
    description: "Track candidate profiles and applications",
    icon: Users,
    href: "/recruitment/candidates",
  },
  {
    title: "Applications",
    description: "Review and process incoming applications",
    icon: FileText,
    href: "/recruitment/applications",
  },
  {
    title: "Interviews",
    description: "Schedule and manage interview process",
    icon: CalendarCheck,
    href: "/recruitment/interviews",
  },
  {
    title: "Offers",
    description: "Create and manage employment offers",
    icon: FileCheck,
    href: "/recruitment/offers",
  },
  {
    title: "Onboarding",
    description: "Manage new hire onboarding plans",
    icon: UserPlus,
    href: "/recruitment/onboarding",
  },
  {
    title: "Referrals",
    description: "Track employee referrals and rewards",
    icon: Award,
    href: "/recruitment/referrals",
  },
  {
    title: "Background Checks",
    description: "Manage candidate verification checks",
    icon: ClipboardCheck,
    href: "/recruitment/checks",
  },
];

export default function RecruitmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recruitment</h1>
        <p className="text-muted-foreground">Talent acquisition, hiring, and onboarding</p>
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
