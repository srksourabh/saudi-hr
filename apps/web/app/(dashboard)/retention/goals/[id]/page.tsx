"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, Target, Calendar, User, CheckCircle2 } from "lucide-react";

export default function GoalDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: goal, isLoading } = api.retention.goal.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading goal...</div>;
  }

  if (!goal) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Goal not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/goals")}>
          Back to Goals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/retention/goals")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{goal.title}</h1>
              <Badge variant="outline" className="capitalize">
                {goal.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{goal.description ?? "Employee performance goal"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-slate-900">{goal.employee?.fullName ?? "—"}</div>
            <p className="text-xs text-slate-500">Assigned employee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{goal.progress ?? 0}%</div>
            <p className="mt-1 text-xs text-slate-500">Goal completion level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-slate-500">Start:</span> {goal.startDate ? new Date(goal.startDate).toLocaleDateString() : "—"}</div>
            <div><span className="text-slate-500">End:</span> {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : "—"}</div>
          </CardContent>
        </Card>
      </div>

      {goal.keyResults && goal.keyResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goal.keyResults.map((kr: any) => (
                <div key={kr.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{kr.title}</p>
                    <p className="text-xs text-slate-500">Target: {kr.targetValue} {kr.unit ?? ""}</p>
                  </div>
                  <Badge variant="secondary">{kr.currentValue ?? 0} / {kr.targetValue}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
