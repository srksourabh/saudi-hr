"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Shield, Plus, Search, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@hrms-app/ui";

const statusIcons: Record<string, React.ReactNode> = {
  passed: <CheckCircle2 className="h-3 w-3" />,
  flagged: <AlertTriangle className="h-3 w-3" />,
  blocked: <XCircle className="h-3 w-3" />,
};

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  passed: "default",
  flagged: "secondary",
  blocked: "destructive",
};

export default function CompliancePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [checkType, setCheckType] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.compliance.list.useQuery({
    status: (status as "passed" | "flagged" | "blocked") || undefined,
    checkType: (checkType || undefined) as any,
    page,
    pageSize: 20,
  });

  const flaggedIssuesCount = (issues: unknown): number => {
    if (Array.isArray(issues)) return issues.length;
    return 0;
  };

  const flaggedIssuesPreview = (issues: unknown): string => {
    if (Array.isArray(issues) && issues.length > 0) return issues[0] as string;
    return "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Checks</h1>
          <p className="text-muted-foreground">Monitor payroll compliance and flagged issues</p>
        </div>
        <Button asChild>
          <Link href="/compliance/new">
            <Plus className="mr-2 h-4 w-4" /> New Check
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search check type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={checkType} onValueChange={(v) => setCheckType(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Check Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Check Types</SelectItem>
                <SelectItem value="wage_protection">Wage Protection</SelectItem>
                <SelectItem value="working_hours">Working Hours</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
                <SelectItem value="social_insurance">Social Insurance</SelectItem>
                <SelectItem value="end_of_service">End of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">Check Type</TableHead>
                <TableHead>Payroll Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flagged Issues</TableHead>
                <TableHead>Created</TableHead>
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
                    No compliance checks found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((check: any) => (
                  <TableRow
                    key={check.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/compliance/${check.id}`)}
                  >
                    <TableCell className="font-medium capitalize">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {check.checkType.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>{check.payrollRun?.id?.slice(0, 8) ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[check.status] ?? "outline"}>
                        <span className="flex items-center gap-1">
                          {statusIcons[check.status]}
                          <span className="capitalize">{check.status}</span>
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {flaggedIssuesCount(check.flaggedIssues) > 0
                          ? `${flaggedIssuesCount(check.flaggedIssues)} issue${flaggedIssuesCount(check.flaggedIssues) !== 1 ? "s" : ""}`
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {check.createdAt ? new Date(check.createdAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/compliance/${check.id}`); }}>
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
