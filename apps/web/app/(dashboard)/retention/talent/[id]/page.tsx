"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, Users, ShieldAlert } from "lucide-react";

export default function TalentReviewDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: talent, isLoading } = api.retention.talentReview.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading talent review...</div>;
  }

  if (!talent) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Talent review not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/talent")}>
          Back to Talent Reviews
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/retention/talent")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{talent.title ?? "Talent Calibration Review"}</h1>
          <p className="text-sm text-slate-500">Nine-box grid and succession planning</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-slate-500 font-medium">Status:</span>{" "}
            <Badge variant="outline" className="capitalize">{talent.status}</Badge>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Description:</span>{" "}
            <span>{talent.description ?? "No details available"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
