"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Users, Plus, Calendar, Star, TrendingUp } from "lucide-react";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  planned: "outline",
  in_progress: "default",
  completed: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TalentReviewsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.retention.talentReview.list.useQuery({
    status: (status as "planned" | "in_progress" | "completed" | "cancelled") || undefined,
    page,
    pageSize: 20,
  });

  const filtered = data?.items.filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Talent Reviews</h1>
          <p className="text-muted-foreground"><TrendingUp className="inline h-4 w-4 mr-1" />Assess and track employee potential and performance</p>
        </div>
        <Button asChild>
          <Link href="/retention/talent/new">
            <Plus className="mr-2 h-4 w-4" /> New Review
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Star className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Name</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !filtered || filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No talent reviews found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((review: any) => (
                  <TableRow
                    key={review.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/retention/talent/${review.id}`)}
                  >
                    <TableCell className="font-medium">{review.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[review.status] ?? "outline"}>
                        {statusLabels[review.status] ?? review.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {review.participants?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/talent/${review.id}`); }}>
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
