"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, Award, BookOpen } from "lucide-react";

export default function SkillDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: skill, isLoading } = api.retention.skill.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading skill...</div>;
  }

  if (!skill) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Skill not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/skills")}>
          Back to Skills
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/retention/skills")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{skill.name}</h1>
          <p className="text-sm text-slate-500">{skill.category ?? "Skill taxonomy entry"}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-slate-500 font-medium">Category:</span>{" "}
            <span className="capitalize">{skill.category ?? "General"}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Description:</span>{" "}
            <span>{skill.description ?? "No description available"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
