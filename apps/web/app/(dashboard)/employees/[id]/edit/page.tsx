"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { ArrowLeft } from "lucide-react";

export default function EditEmployeePage() {
  const router = useRouter();
  const utils = api.useUtils();
  const { id } = useParams<{ id: string }>();

  const { data: employee, isLoading: loadingEmployee } = api.employee.getById.useQuery(id);
  const { data: departments } = api.department.list.useQuery();

  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState<"saudi" | "expat">("saudi");
  const [hireDate, setHireDate] = useState("");
  const [salaryBasic, setSalaryBasic] = useState("");
  const [salaryHousing, setSalaryHousing] = useState("");
  const [salaryTransport, setSalaryTransport] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [gosiSystem, setGosiSystem] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setNationality(employee.nationality);
      setHireDate(employee.hireDate);
      setSalaryBasic(String(Number(employee.salaryBasic)));
      setSalaryHousing(String(Number(employee.salaryHousing)));
      setSalaryTransport(String(Number(employee.salaryTransport)));
      setDepartmentId(employee.departmentId ?? "");
      setGosiSystem(employee.gosiSystem ?? "");
    }
  }, [employee]);

  const updateMutation = api.employee.update.useMutation({
    onSuccess: () => {
      utils.employee.getById.invalidate(id);
      utils.employee.list.invalidate();
      router.push(`/employees/${id}`);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Full name is required"); return; }
    if (!hireDate) { setError("Hire date is required"); return; }
    if (!salaryBasic || Number(salaryBasic) <= 0) { setError("Basic salary must be positive"); return; }

    updateMutation.mutate({
      id,
      data: {
        fullName: fullName.trim(),
        nationality,
        hireDate,
        salaryBasic: Number(salaryBasic),
        salaryHousing: Number(salaryHousing) || 0,
        salaryTransport: Number(salaryTransport) || 0,
        departmentId: (departmentId || undefined) as any,
        gosiSystem: (gosiSystem as "old" | "new") || undefined,
      },
    });
  };

  if (loadingEmployee) {
    return <div className="text-center text-muted-foreground py-12">Loading...</div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Employee not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/employees")}>
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Employee</h1>
          <p className="text-muted-foreground">Update {employee.fullName}&apos;s information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Employee full name" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nationality *</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value as "saudi" | "expat")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="saudi">Saudi</option>
                  <option value="expat">Expat</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hire Date *</label>
                <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">No department</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Basic Salary (SAR) *</label>
                <Input type="number" min="0" step="0.01" value={salaryBasic} onChange={(e) => setSalaryBasic(e.target.value)} placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Housing Allowance (SAR)</label>
                <Input type="number" min="0" step="0.01" value={salaryHousing} onChange={(e) => setSalaryHousing(e.target.value)} placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Transport Allowance (SAR)</label>
                <Input type="number" min="0" step="0.01" value={salaryTransport} onChange={(e) => setSalaryTransport(e.target.value)} placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GOSI System</label>
                <select
                  value={gosiSystem}
                  onChange={(e) => setGosiSystem(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Not applicable</option>
                  <option value="old">Old</option>
                  <option value="new">New</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
