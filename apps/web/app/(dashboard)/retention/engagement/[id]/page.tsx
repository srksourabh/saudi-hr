"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, BarChart3, Calendar, Users, CheckCircle2, Heart } from "lucide-react";

export default function EngagementSurveyDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: survey, isLoading } = api.retention.engagementSurvey.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading survey...</div>;
  }

  if (!survey) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Engagement survey not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/engagement")}>
          Back to Engagement Surveys
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/retention/engagement")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{survey.name}</h1>
              <Badge variant="outline" className="capitalize">
                {survey.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{survey.description ?? "Employee engagement survey"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Survey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Anonymous</span>
              <span className="font-semibold">{survey.isAnonymous ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Start Date</span>
              <span className="font-semibold">
                {survey.startDate ? new Date(survey.startDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">End Date</span>
              <span className="font-semibold">
                {survey.endDate ? new Date(survey.endDate).toLocaleDateString() : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">
              {survey.responses?.length ?? 0}
            </div>
            <p className="mt-1 text-xs text-slate-500">Total submitted responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Targeting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold capitalize text-slate-900">
              {survey.targetAudience ? survey.targetAudience.replace("_", " ") : "All Employees"}
            </div>
            <p className="mt-1 text-xs text-slate-500">Target audience scope</p>
          </CardContent>
        </Card>
      </div>

      {survey.responses && survey.responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Response Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {survey.responses.map((resp: any) => (
                <div key={resp.id} className="rounded-lg border p-4 text-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Submitted on {new Date(resp.submittedAt ?? resp.createdAt).toLocaleDateString()}</span>
                    <span>{resp.employee?.fullName ?? "Anonymous"}</span>
                  </div>
                  {resp.overallScore != null && (
                    <div className="mt-2 font-semibold">
                      Score: {resp.overallScore} / 5
                    </div>
                  )}
                  {resp.comments && <p className="mt-1 text-slate-700">{resp.comments}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
