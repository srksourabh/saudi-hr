"use client";

import { api } from "~/trpc/react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@hrms-app/ui";
import { Trash2 } from "lucide-react";
import Link from "next/link";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: dept, isLoading } = api.department.getById.useQuery(id);
  const deleteMutation = api.department.delete.useMutation({
    onSuccess: () => {
      router.push("/departments");
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!dept) return <div>Department not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dept.name}</h1>
          <p className="text-muted-foreground">Department details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/departments/${id}/edit`}>Edit</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this department?")) deleteMutation.mutate(id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{dept.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Parent Department</p>
              <p className="font-medium">
                {dept.parent ? (
                  <Link href={`/departments/${dept.parent.id}`} className="hover:underline">
                    {dept.parent.name}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Head</p>
              <p className="font-medium">{dept.head?.fullName ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sub-departments</CardTitle>
          </CardHeader>
          <CardContent>
            {dept.children && dept.children.length > 0 ? (
              <ul className="space-y-2">
                {dept.children.map((child: any) => (
                  <li key={child.id}>
                    <Link
                      href={`/departments/${child.id}`}
                      className="flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      {child.name}
                      <span className="text-muted-foreground">({child.head?.fullName ?? "no head"})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No sub-departments</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({dept.employees?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {dept.employees && dept.employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Name</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Nationality</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.employees.map((emp: any) => (
                    <tr key={emp.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 align-middle">{emp.fullName}</td>
                      <td className="p-4 align-middle capitalize">{emp.nationality}</td>
                      <td className="p-4 align-middle capitalize">{emp.employmentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No employees in this department</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
