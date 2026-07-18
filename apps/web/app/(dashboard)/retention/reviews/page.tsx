"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardHeader, CardContent, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, User, Star } from "lucide-react";

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  pending: "outline",
  in_progress: "default",
  submitted: "secondary",
  acknowledged: "default",
  completed: "default",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  completed: "Completed",
};

const typeLabels: Record<string, string> = {
  annual: "Annual",
  mid_year: "Mid Year",
  probation: "Probation",
  project: "Project",
  "360": "360",
};

export default function ReviewsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.retention.review.list.useQuery({
    status: (status as "pending" | "in_progress" | "submitted" | "acknowledged" | "completed") || undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Reviews</h1>
          <p className="text-muted-foreground">Manage employee performance reviews</p>
        </div>
        <Button asChild>
          <Link href="/retention/reviews/new">
            <Plus className="mr-2 h-4 w-4" /> New Review
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Final Rating</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reviews found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((review: any) => (
                  <TableRow
                    key={review.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/retention/reviews/${review.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{review.employee?.fullName ?? "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{typeLabels[review.type] ?? review.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[review.status] ?? "outline"}
                        className={review.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {statusLabels[review.status] ?? review.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {review.finalRating != null ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <Badge variant="outline">{review.finalRating}/5</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {review.completedAt
                        ? new Date(review.completedAt).toLocaleDateString()
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/reviews/${review.id}`); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} total)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={data.page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={data.page === data.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
