"use client";

import { api } from "~/trpc/react";
import Link from "next/link";
import { Button, Badge } from "@hrms-app/ui";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TreeNode {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  headEmployeeId: string | null;
  head: { id: string; fullName: string } | null;
  employees: { id: string }[];
  children: TreeNode[];
}

function DeptRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const deleteMutation = api.department.delete.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <>
      <tr className="border-b hover:bg-muted/50">
        <td className="p-4 align-middle" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button onClick={() => setExpanded(!expanded)} className="h-4 w-4">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            {!hasChildren && <span className="w-4" />}
            <Link href={`/departments/${node.id}`} className="font-medium hover:underline">
              {node.name}
            </Link>
          </div>
        </td>
        <td className="p-4 align-middle">{node.head?.fullName ?? "—"}</td>
        <td className="p-4 align-middle">{node.employees?.length ?? 0}</td>
        <td className="p-4 align-middle">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/departments/${node.id}`}>View</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this department?")) deleteMutation.mutate(node.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
      {hasChildren && expanded && node.children.map((child: any) => <DeptRow key={child.id} node={child} depth={depth + 1} />)}
    </>
  );
}

export default function DepartmentsPage() {
  const { data: tree, isLoading } = api.department.tree.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage departments and hierarchy</p>
        </div>
        <Button asChild>
          <Link href="/departments/new">
            <Plus className="mr-2 h-4 w-4" /> New Department
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Name</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Head</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Employees</th>
              <th className="h-12 px-4 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tree?.map((node: any) => <DeptRow key={node.id} node={node} depth={0} />)}
            {(!tree || tree.length === 0) && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  No departments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
