"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Target, Plus, Search, Clock, CheckCircle2 } from "lucide-react";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  draft: "outline",
  active: "default",
  on_track: "default",
  at_risk: "secondary",
  off_track: "destructive",
  completed: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  completed: "Completed",
  cancelled: "Cancelled",
};

const typeLabels: Record<string, string> = {
  okr: "OKR",
  kpi: "KPI",
  project: "Project",
  development: "Development",
  behavioral: "Behavioral",
};

export default function GoalsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.retention.goal.list.useQuery({
    status: (status as "draft" | "active" | "on_track" | "at_risk" | "off_track" | "completed" | "cancelled") || undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Track employee goals and OKRs</p>
        </div>
        <Button asChild>
          <Link href="/retention/goals/new">
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="off_track">Off Track</SelectItem>
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
                <TableHead className="w-[25%]">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
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
                    No goals found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((goal: any) => (
                  <TableRow
                    key={goal.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/retention/goals/${goal.id}`)}
                  >
                    <TableCell className="font-medium">{goal.title}</TableCell>
                    <TableCell className="capitalize">{typeLabels[goal.type] ?? goal.type}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[goal.status] ?? "outline"}>
                        {statusLabels[goal.status] ?? goal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{goal.progress}%</Badge>
                    </TableCell>
                    <TableCell>{goal.startDate ? goal.startDate.split("T")[0] : "-"}</TableCell>
                    <TableCell>{goal.endDate ? goal.endDate.split("T")[0] : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/goals/${goal.id}`); }}>
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
