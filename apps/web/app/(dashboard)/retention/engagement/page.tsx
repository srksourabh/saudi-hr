"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, CardHeader, CardTitle, CardContent, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Heart, Plus, Calendar, Users, BarChart3 } from "lucide-react";

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  scheduled: "default",
  open: "default",
  closed: "secondary",
  analyzed: "default",
  action_planning: "secondary",
  completed: "outline",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  open: "Open",
  closed: "Closed",
  analyzed: "Analyzed",
  action_planning: "Action Planning",
  completed: "Completed",
};

export default function EngagementSurveysPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.retention.engagementSurvey.list.useQuery({
    status: (status as "draft" | "scheduled" | "open" | "closed" | "analyzed" | "action_planning" | "completed") || undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold">Engagement Surveys</h1>
          </div>
          <p className="text-muted-foreground">Create and manage employee engagement surveys</p>
        </div>
        <Button asChild>
          <Link href="/retention/engagement/new">
            <Plus className="mr-2 h-4 w-4" /> New Survey
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
                <SelectItem value="action_planning">Action Planning</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Anonymous</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No engagement surveys found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((survey: any) => (
                  <TableRow
                    key={survey.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/retention/engagement/${survey.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        {survey.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariants[survey.status] ?? "outline"}
                        className={survey.status === "open" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {statusLabels[survey.status] ?? survey.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {survey.startDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{new Date(survey.startDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {survey.endDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{new Date(survey.endDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{survey.responses?.length ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={survey.isAnonymous ? "outline" : "secondary"}>
                        {survey.isAnonymous ? "Anonymous" : "Named"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/engagement/${survey.id}`); }}>
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
