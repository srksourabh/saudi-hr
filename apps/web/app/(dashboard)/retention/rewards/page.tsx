"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Gift, Plus, Star, Award, Clock } from "lucide-react";

const rewardTypeBadges: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  monetary: "default",
  non_monetary: "secondary",
  time_off: "outline",
  gift: "default",
  experience: "secondary",
  development: "outline",
  public_recognition: "destructive",
};

const rewardTypeLabels: Record<string, string> = {
  monetary: "Monetary",
  non_monetary: "Non-Monetary",
  time_off: "Time Off",
  gift: "Gift",
  experience: "Experience",
  development: "Development",
  public_recognition: "Public Recognition",
};

const statusColors: Record<string, "default" | "secondary"> = {
  active: "default",
  inactive: "secondary",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
};

export default function RewardsPage() {
  const router = useRouter();
  const [rewardPage, setRewardPage] = useState(1);

  const { data: rewardsData, isLoading: rewardsLoading } = api.retention.reward.list.useQuery({
    page: rewardPage,
    pageSize: 20,
  });

  const { data: recognitionsData, isLoading: recognitionsLoading } = api.retention.recognition.list.useQuery({
    page: 1,
    pageSize: 10,
  });

  return (
    <div className="space-y-8">
      {/* Rewards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rewards & Recognition</h1>
            <p className="text-muted-foreground">Manage reward catalogs and peer recognition</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/retention/rewards/recognitions/new">
                <Star className="mr-2 h-4 w-4" /> New Recognition
              </Link>
            </Button>
            <Button asChild>
              <Link href="/retention/rewards/new">
                <Plus className="mr-2 h-4 w-4" /> New Reward
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" /> Reward Catalog
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewardsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rewardsData?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No rewards found
                    </TableCell>
                  </TableRow>
                ) : (
                  rewardsData?.items.map((reward: any) => (
                    <TableRow
                      key={reward.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/retention/rewards/${reward.id}`)}
                    >
                      <TableCell className="font-medium">{reward.name}</TableCell>
                      <TableCell>
                        <Badge variant={rewardTypeBadges[reward.type] ?? "outline"}>
                          {rewardTypeLabels[reward.type] ?? reward.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{reward.value ? `${reward.currency ?? "SAR"} ${reward.value}` : "-"}</TableCell>
                      <TableCell>{reward.quantity ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[reward.status] ?? "secondary"}>
                          {statusLabels[reward.status] ?? reward.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/rewards/${reward.id}`); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {rewardsData && rewardsData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Page {rewardsData.page} of {rewardsData.totalPages} ({rewardsData.total} total)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRewardPage(p => Math.max(1, p - 1))} disabled={rewardsData.page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRewardPage(p => Math.min(rewardsData.totalPages, p + 1))} disabled={rewardsData.page === rewardsData.totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recognition Feed Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Recent Recognitions
            </CardTitle>
            {recognitionsData && recognitionsData.total > 5 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/retention/rewards/recognitions">
                  View all <Clock className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recognitionsLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : recognitionsData?.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recognitions yet</p>
          ) : (
            <div className="space-y-4">
              {recognitionsData?.items.map((recognition: any) => (
                <div
                  key={recognition.id}
                  className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/retention/rewards/recognitions/${recognition.id}`)}
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {recognition.fromUser?.name ?? "Someone"} {"-> "}
                      {recognition.toUser?.name ?? "someone"}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{recognition.message ?? recognition.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recognition.createdAt ? new Date(recognition.createdAt).toLocaleDateString() : ""}
                      {recognition.badge && (
                        <Badge variant="outline" className="ml-2 text-xs">{recognition.badge}</Badge>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
