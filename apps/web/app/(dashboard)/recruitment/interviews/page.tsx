"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, TabsContent, Input } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search, Calendar, Clock, Users, Video, Monitor, MapPin, Phone } from "lucide-react";

const typeIcons: Record<string, any> = {
  phone_screen: Phone,
  video: Video,
  in_person: MapPin,
  technical: Monitor,
  panel: Users,
  cultural_fit: Users,
  final: Users,
};

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  scheduled: "default",
  completed: "default",
  cancelled: "destructive",
  no_show: "destructive",
  rescheduled: "secondary",
};

function InterviewTypeIcon({ type }: { type: string }) {
  const Icon = typeIcons[type];
  return Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null;
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] ?? "outline";
  return <Badge variant={color}>{status.replace("_", " ")}</Badge>;
}

export default function InterviewsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const pageSize = 20;

  const { data, isLoading } = api.recruitment.interview.list.useQuery({
    search,
    status: (status || undefined) as any,
    type: (type || undefined) as any,
    page,
    pageSize,
  } as any);

  const tabs = [
    { id: "all", label: "All" },
    { id: "scheduled", label: "Scheduled" },
    { id: "completed", label: "Completed" },
    { id: "pending_feedback", label: "Pending Feedback" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-muted-foreground">Schedule and manage interviews</p>
        </div>
        <Button asChild>
          <Link href="/recruitment/interviews/new">
            <Plus className="mr-2 h-4 w-4" /> Schedule Interview
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidate, job..."
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
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="phone_screen">Phone Screen</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="in_person">In Person</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="panel">Panel</SelectItem>
              <SelectItem value="cultural_fit">Cultural Fit</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab: any) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab: any) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            <InterviewsTable 
              data={data} 
              isLoading={isLoading} 
              page={page} 
              setPage={setPage} 
              statusFilter={tab.id === "all" ? "" : tab.id}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InterviewsTable({ data, isLoading, page, setPage, statusFilter }: {
  data: any;
  isLoading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
  statusFilter: string;
}) {
  const router = useRouter();
  const filteredItems = data?.items.filter((i: any) => !statusFilter || i.status === statusFilter) ?? [];

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Calendar className="h-4 w-4 mx-auto" /></TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Interviewers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No interviews found</TableCell>
              </TableRow>
            ) : (
              filteredItems.map((interview: any) => (
                <TableRow key={interview.id} className="cursor-pointer" onClick={() => router.push(`/recruitment/interviews/${interview.id}`)}>
                  <TableCell><Calendar className="h-4 w-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="font-medium">{interview.application?.candidate?.firstName} {interview.application?.candidate?.lastName}</TableCell>
                  <TableCell>{interview.application?.jobRequisition?.title}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <InterviewTypeIcon type={interview.type} />
                    <span className="capitalize">{interview.type.replace("_", " ")}</span>
                  </TableCell>
                  <TableCell>{new Date(interview.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell><Clock className="h-4 w-4 inline mr-1" /> {interview.durationMinutes} min</TableCell>
                  <TableCell>{interview.interviewerIds?.length} interviewer(s)</TableCell>
                  <TableCell>
                    <StatusBadge status={interview.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); router.push(`/recruitment/interviews/${interview.id}`); }}>
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