"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, Briefcase, GitCommit } from "lucide-react";

export default function CareerRoleDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: role, isLoading } = api.retention.careerRole.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading career role...</div>;
  }

  if (!role) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Career role not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/career")}>
          Back to Career Mobility
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/retention/career")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{role.title}</h1>
          <p className="text-sm text-slate-500">{role.department?.name ?? "Career framework role"}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-slate-500 font-medium">Job Family:</span>{" "}
            <span className="capitalize">{role.jobFamily ?? "—"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Description:</span>{" "}
            <span>{role.description ?? "No description available"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
