"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search, Users, DollarSign } from "lucide-react";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  submitted: "outline",
  screening: "secondary",
  interviewed: "default",
  hired: "default",
  rejected: "destructive",
  reward_paid: "default",
};

export default function ReferralsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = api.recruitment.referral.list.useQuery({
    search,
    status: (status || undefined) as any,
    page,
    pageSize,
  } as any);

  const myReferrals = api.recruitment.referral.myReferrals.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Referrals</h1>
          <p className="text-muted-foreground">Manage and track employee referral program</p>
        </div>
        <Button asChild>
          <Link href="/recruitment/referrals/new">
            <Plus className="mr-2 h-4 w-4" /> Submit Referral
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
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interviewed">Interviewed</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="reward_paid">Reward Paid</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Referrals</TabsTrigger>
          <TabsTrigger value="mine">My Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ReferralsTable data={data} isLoading={isLoading} page={page} setPage={setPage} />
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <MyReferralsTable data={myReferrals.data} isLoading={myReferrals.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReferralsTable({ data, isLoading, page, setPage }: {
  data: any;
  isLoading: boolean;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
}) {
  const router = useRouter();
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Users className="h-4 w-4 mx-auto" /></TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No referrals found</TableCell>
              </TableRow>
            ) : (
              data?.items.map((ref: any) => (
                <TableRow key={ref.id} className="cursor-pointer" onClick={() => router.push(`/recruitment/referrals/${ref.id}`)}>
                  <TableCell><Users className="h-4 w-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="font-medium">{ref.candidate?.firstName} {ref.candidate?.lastName}</TableCell>
                  <TableCell>{ref.referrer?.fullName}</TableCell>
                  <TableCell>{ref.jobRequisition?.title ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[ref.status] ?? "outline"}>
                      {ref.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ref.rewardAmount ? (
                      <>
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        {ref.rewardAmount}
                      </>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{new Date(ref.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); router.push(`/recruitment/referrals/${ref.id}`); }}>
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

function MyReferralsTable({ data, isLoading }: { data: any; isLoading: boolean }) {
  const router = useRouter();
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Users className="h-4 w-4 mx-auto" /></TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No referrals submitted</TableCell>
              </TableRow>
            ) : (
              data.map((ref: any) => (
                <TableRow key={ref.id} className="cursor-pointer" onClick={() => router.push(`/recruitment/referrals/${ref.id}`)}>
                  <TableCell><Users className="h-4 w-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="font-medium">{ref.candidate?.firstName} {ref.candidate?.lastName}</TableCell>
                  <TableCell>{ref.jobRequisition?.title ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[ref.status] ?? "outline"}>
                      {ref.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ref.rewardAmount ? (
                      <>
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        {ref.rewardAmount}
                      </>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{new Date(ref.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); router.push(`/recruitment/referrals/${ref.id}`); }}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@hrms-app/ui";