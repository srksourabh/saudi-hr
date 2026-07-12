"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { TrendingUp, Plus, User, Building2, Clock } from "lucide-react";

const statusVariants: Record<string, "default" | "outline"> = {
  active: "default",
  inactive: "outline",
};

export default function CareerPathsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.retention.careerRole.list.useQuery({
    search: (search || undefined) as any,
    status: (status as "active" | "inactive") || undefined,
    page,
    pageSize: 20,
  } as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Career Paths</h1>
          <p className="text-muted-foreground">Manage career roles and succession planning</p>
        </div>
        <Button asChild>
          <Link href="/retention/career/new">
            <Plus className="mr-2 h-4 w-4" /> New Career Role
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <TrendingUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Title</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Min Salary</TableHead>
                <TableHead>Max Salary</TableHead>
                <TableHead>Status</TableHead>
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
                    No career roles found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((role: any) => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/retention/career/${role.id}`)}
                  >
                    <TableCell className="font-medium">{role.title}</TableCell>
                    <TableCell>{role.level}</TableCell>
                    <TableCell>{role.department?.name ?? "-"}</TableCell>
                    <TableCell>
                      {role.minSalary ? `$${role.minSalary.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      {role.maxSalary ? `$${role.maxSalary.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[role.status] ?? "outline"}>
                        {role.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/career/${role.id}`); }}>
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
