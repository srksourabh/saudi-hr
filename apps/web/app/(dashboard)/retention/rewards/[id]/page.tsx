"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@hrms-app/ui";
import { ArrowLeft, Gift, Award } from "lucide-react";

export default function RewardDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: reward, isLoading } = api.retention.reward.getById.useQuery(id);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading reward...</div>;
  }

  if (!reward) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Reward catalog item not found</p>
        <Button variant="outline" onClick={() => router.push("/retention/rewards")}>
          Back to Total Rewards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/retention/rewards")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{reward.title}</h1>
          <p className="text-sm text-slate-500">Reward catalog entry</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-slate-500 font-medium">Points Value:</span>{" "}
            <Badge variant="secondary">{reward.pointsCost ?? 0} pts</Badge>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Description:</span>{" "}
            <span>{reward.description ?? "No description available"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
