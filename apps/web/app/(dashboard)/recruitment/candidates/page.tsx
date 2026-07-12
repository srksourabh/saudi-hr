"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Plus, Search, User, Mail, Phone, Filter } from "lucide-react";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  new: "outline",
  screening: "secondary",
  interviewing: "default",
  offer: "default",
  hired: "default",
  rejected: "destructive",
  withdrawn: "destructive",
};

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = api.recruitment.candidate.list.useQuery({
    search,
    status: (status || undefined) as any,
    source: (source || undefined) as any,
    page,
    pageSize,
  } as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">Manage candidate pool and talent pipeline</p>
        </div>
        <Button asChild>
          <Link href="/recruitment/candidates/new">
            <Plus className="mr-2 h-4 w-4" /> Add Candidate
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email..."
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={(v) => { setSource(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All sources</SelectItem>
              <SelectItem value="job_board">Job Board</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="career_site">Career Site</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><User className="h-4 w-4" /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Title</TableHead>
                <TableHead>Experience</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No candidates found</TableCell>
                </TableRow>
              ) : (
                data?.items.map((candidate: any) => (
                  <TableRow key={candidate.id} className="cursor-pointer" onClick={() => window.location.href = `/recruitment/candidates/${candidate.id}`}>
                    <TableCell><User className="h-4 w-4 text-muted-foreground" /></TableCell>
                    <TableCell className="font-medium">{candidate.firstName} {candidate.lastName}</TableCell>
                    <TableCell className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {candidate.email}
                      </div>
                      {candidate.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" /> {candidate.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{candidate.source?.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[candidate.status] ?? "outline"}>
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{candidate.currentTitle ?? "-"}</TableCell>
                    <TableCell>{candidate.yearsExperience ? `${candidate.yearsExperience} yrs` : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild onClick={(e) => { e.stopPropagation(); window.location.href = `/recruitment/candidates/${candidate.id}`; }}>
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
    </div>
  );
}