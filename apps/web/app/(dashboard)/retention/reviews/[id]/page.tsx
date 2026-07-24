"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, User, Star, Calendar, FileCheck } from "lucide-react";

export default function ReviewDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: review, isLoading } = api.retention.review.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading review...</div>;
  }

  if (!review) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Performance review not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/reviews")}>
          Back to Reviews
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/retention/reviews")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{review.employee?.fullName ?? "Performance Review"}</h1>
              <Badge variant="outline" className="capitalize">
                {review.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{review.cycle?.name ?? "Performance Review Cycle"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-slate-900">{review.employee?.fullName ?? "—"}</div>
            <p className="text-xs text-slate-500">{review.employee?.department?.name ?? "No department"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Final Rating</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
            <div className="text-3xl font-bold text-slate-900">{review.finalRating ?? "—"}</div>
            {review.finalRating && <span className="text-sm text-slate-500">/ 5</span>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-slate-900">{review.reviewer?.fullName ?? "—"}</div>
            <p className="text-xs text-slate-500">Assigned Reviewer</p>
          </CardContent>
        </Card>
      </div>

      {review.summaryNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Summary & Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{review.summaryNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
