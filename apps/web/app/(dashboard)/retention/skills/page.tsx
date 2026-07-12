"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { BookOpen, Plus, Search, Filter } from "lucide-react";

const categoryColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  technical: "default",
  soft: "secondary",
  leadership: "default",
  domain: "outline",
  language: "secondary",
  certification: "destructive",
};

const categoryLabels: Record<string, string> = {
  technical: "Technical",
  soft: "Soft",
  leadership: "Leadership",
  domain: "Domain",
  language: "Language",
  certification: "Certification",
};

export default function SkillsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.retention.skill.list.useQuery({
    search: (search || undefined) as any,
    category: (category as "technical" | "soft" | "leadership" | "domain" | "language" | "certification") || undefined,
    page,
    pageSize: 20,
  } as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skills</h1>
          <p className="text-muted-foreground">Manage skill records and competencies</p>
        </div>
        <Button asChild>
          <Link href="/retention/skills/new">
            <Plus className="mr-2 h-4 w-4" /> New Skill
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="language">Language</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No skills found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((skill: any) => (
                  <TableRow
                    key={skill.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/retention/skills/${skill.id}`)}
                  >
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell>
                      <Badge variant={categoryColors[skill.category] ?? "outline"}>
                        {categoryLabels[skill.category] ?? skill.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={skill.active ? "default" : "outline"}>
                        {skill.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{skill.createdAt ? new Date(skill.createdAt).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/retention/skills/${skill.id}`); }}>
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
