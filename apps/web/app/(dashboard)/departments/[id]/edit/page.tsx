"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@hrms-app/ui";
import { ArrowLeft, Building2 } from "lucide-react";

export default function EditDepartmentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: dept, isLoading } = api.department.getById.useQuery(id);
  const { data: allDepts } = api.department.list.useQuery();
  const { data: employees } = api.employee.list.useQuery({ pageSize: 200 });

  const [name, setName] = useState("");
  const [parentDepartmentId, setParentDepartmentId] = useState<string>("");
  const [headEmployeeId, setHeadEmployeeId] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (dept) {
      setName(dept.name ?? "");
      setParentDepartmentId(dept.parentDepartmentId ?? "");
      setHeadEmployeeId(dept.headEmployeeId ?? "");
    }
  }, [dept]);

  const updateMutation = api.department.update.useMutation({
    onSuccess: () => {
      router.push(`/departments/${id}`);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    updateMutation.mutate({
      id,
      data: {
        name: name.trim(),
        parentDepartmentId: parentDepartmentId || undefined,
        headEmployeeId: headEmployeeId || undefined,
      },
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading department...</div>;
  }

  if (!dept) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-lg font-medium">Department not found</p>
        <Button variant="outline" onClick={() => router.push("/departments")}>
          Back to Departments
        </Button>
      </div>
    );
  }

  const parentOptions = (allDepts ?? []).filter((d: any) => d.id !== id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Department</h1>
          <p className="text-sm text-slate-500">Update department details and hierarchy</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            {dept.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Department Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Department name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parent Department</label>
              <select
                value={parentDepartmentId}
                onChange={(e) => setParentDepartmentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              >
                <option value="">No parent (Top level)</option>
                {parentOptions.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Department Head</label>
              <select
                value={headEmployeeId}
                onChange={(e) => setHeadEmployeeId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              >
                <option value="">No head assigned</option>
                {(employees ?? []).map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" type="button" onClick={() => router.push(`/departments/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
