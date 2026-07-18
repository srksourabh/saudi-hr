"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Input } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search, Shield, UserCheck, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const bgStatusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  pending: "outline",
  in_progress: "secondary",
  clear: "default",
  flagged: "destructive",
  failed: "destructive",
};

const refStatusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  pending: "outline",
  contacted: "secondary",
  completed: "default",
  positive: "default",
  negative: "destructive",
};

const bgStatusIcons: Record<string, any> = {
  pending: Clock,
  in_progress: Clock,
  clear: CheckCircle,
  flagged: AlertTriangle,
  failed: XCircle,
};

const refStatusIcons: Record<string, any> = {
  pending: Clock,
  contacted: Shield,
  completed: CheckCircle,
  positive: CheckCircle,
  negative: XCircle,
};

function BgStatusIcon({ status }: { status: string }) {
  const Icon = bgStatusIcons[status];
  return Icon ? <Icon className="h-4 w-4 text-muted-foreground mx-auto" /> : null;
}

function RefStatusIcon({ status }: { status: string }) {
  const Icon = refStatusIcons[status];
  return Icon ? <Icon className="h-4 w-4 text-muted-foreground mx-auto" /> : null;
}

function BgStatusBadge({ status }: { status: string }) {
  const color = bgStatusColors[status] ?? "outline";
  const Icon = bgStatusIcons[status];
  return (
    <Badge variant={color} className="flex items-center gap-1">
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {status.replace("_", " ")}
    </Badge>
  );
}

function RefStatusBadge({ status }: { status: string }) {
  const color = refStatusColors[status] ?? "outline";
  const Icon = refStatusIcons[status];
  return (
    <Badge variant={color} className="flex items-center gap-1">
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function ChecksPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("background");
  const pageSize = 20;

  const { data: bgData, isLoading: bgLoading } = api.recruitment.backgroundCheck.list.useQuery({
    search,
    status: (status || undefined) as any,
    page,
    pageSize,
  } as any);

  const { data: refData, isLoading: refLoading } = api.recruitment.referenceCheck.list.useQuery({
    search,
    status: (status || undefined) as any,
    page,
    pageSize,
  } as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Background & Reference Checks</h1>
          <p className="text-muted-foreground">Manage candidate verification processes</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/recruitment/checks/background/new">
              <Plus className="mr-2 h-4 w-4" /> Background Check
            </Link>
          </Button>
          <Button asChild>
            <Link href="/recruitment/checks/reference/new">
              <Plus className="mr-2 h-4 w-4" /> Reference Check
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidate name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="clear">Clear</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="background">
            <Shield className="mr-2 h-4 w-4" /> Background Checks
          </TabsTrigger>
          <TabsTrigger value="reference">
            <UserCheck className="mr-2 h-4 w-4" /> Reference Checks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="background" className="mt-4">
          <ChecksTable 
            data={bgData} 
            isLoading={bgLoading} 
            page={page} 
            setPage={setPage} 
            type="background"
          />
        </TabsContent>

        <TabsContent value="reference" className="mt-4">
          <ChecksTable 
            data={refData} 
            isLoading={refLoading} 
            page={page} 
            setPage={setPage} 
            type="reference"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChecksTable({ data, isLoading, page, setPage, type }: {
  data: any;
  isLoading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  type: "background" | "reference";
}) {
  const router = useRouter();
  const StatusIcon = type === "background" ? BgStatusIcon : RefStatusIcon;
  const StatusBadge = type === "background" ? BgStatusBadge : RefStatusBadge;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Shield className="h-4 w-4 mx-auto" /></TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              {type === "background" ? (
                <>
                  <TableHead>Provider</TableHead>
                  <TableHead>Checks</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Referee</TableHead>
                  <TableHead>Relationship</TableHead>
                </>
              )}
              <TableHead>Status</TableHead>
              <TableHead>Initiated</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No {type} checks found
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((check: any) => (
                <TableRow key={check.id} className="cursor-pointer" onClick={() => router.push(`/recruitment/checks/${type}/${check.id}`)}>
                  <TableCell><StatusIcon status={check.status} /></TableCell>
                  <TableCell className="font-medium">
                    {check.candidate?.firstName} {check.candidate?.lastName}
                    <br />
                    <span className="text-sm text-muted-foreground">{check.candidate?.email}</span>
                  </TableCell>
                  <TableCell>
                    {check.application?.jobRequisition?.title}
                    <br />
                    <span className="text-sm text-muted-foreground">{check.application?.jobRequisition?.department?.name}</span>
                  </TableCell>
                  {type === "background" ? (
                    <>
                      <TableCell>{check.provider ?? "-"}</TableCell>
                      <TableCell>
                        {check.checks && Object.entries(check.checks).map(([key, value]: [string, any]) => (
                          <Badge key={key} variant={value ? "default" : "outline"} className="mr-1 mb-1">
                            {key}: {value ? "✓" : "✗"}
                          </Badge>
                        ))}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{check.refereeName}</TableCell>
                      <TableCell>{check.relationship ?? "-"}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <StatusBadge status={check.status} />
                  </TableCell>
                  <TableCell>{check.initiatedAt ? new Date(check.initiatedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{check.completedAt ? new Date(check.completedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); router.push(`/recruitment/checks/${type}/${check.id}`); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}