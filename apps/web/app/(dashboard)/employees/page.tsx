"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { Download, Plus, Search, Upload } from "lucide-react";

const statusColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  active: "default",
  terminated: "destructive",
  suspended: "secondary",
  on_leave: "outline",
};

const customColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  on_leave: "bg-blue-100 text-blue-800 border-blue-200",
};

const employeeCsvHeaders = [
  "fullName",
  "nationality",
  "hireDate",
  "departmentName",
  "designationTitle",
  "managerFullName",
  "jobTitle",
  "gosiSystem",
  "iqamaNumberEnc",
  "salaryBasic",
  "salaryHousing",
  "salaryTransport",
];

type ParsedEmployeeCsvRow = {
  fullName: string;
  nationality: "saudi" | "expat";
  hireDate: string;
  departmentName?: string;
  designationTitle?: string;
  managerFullName?: string;
  jobTitle?: string;
  gosiSystem?: "old" | "new";
  iqamaNumberEnc?: string;
  salaryBasic: number;
  salaryHousing: number;
  salaryTransport: number;
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseEmployeeCsv(text: string): ParsedEmployeeCsvRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must include a header row and at least one employee row.");
  const headerLine = lines[0];
  if (!headerLine) throw new Error("CSV header row is missing.");
  const headers = splitCsvLine(headerLine).map((header) => header.trim());
  const missing = employeeCsvHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) throw new Error(`Missing CSV columns: ${missing.join(", ")}`);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as Record<string, string>;
    const gosiSystem =
      record.gosiSystem === "old" || record.gosiSystem === "new"
        ? record.gosiSystem
        : undefined;
    return {
      fullName: record.fullName ?? "",
      nationality: record.nationality === "expat" ? "expat" as const : "saudi" as const,
      hireDate: record.hireDate ?? "",
      departmentName: record.departmentName || undefined,
      designationTitle: record.designationTitle || undefined,
      managerFullName: record.managerFullName || undefined,
      jobTitle: record.jobTitle || undefined,
      gosiSystem,
      iqamaNumberEnc: record.iqamaNumberEnc || undefined,
      salaryBasic: Number(record.salaryBasic),
      salaryHousing: Number(record.salaryHousing || 0),
      salaryTransport: Number(record.salaryTransport || 0),
    };
  });
}

function downloadEmployeeSample() {
  const rows = [
    employeeCsvHeaders.join(","),
    "Aisha Al-Harbi,saudi,2026-01-10,People Operations,HR Manager,,HR Manager,new,1000000001,18000,4500,1500",
    "Omar Khan,expat,2026-02-01,Field Operations,Technician,Aisha Al-Harbi,Field Technician,,2000000001,9000,2500,900",
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "employee-import-sample.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function EmployeesPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [importMessage, setImportMessage] = useState("");

  const { data, isLoading } = api.employee.list.useQuery({
    search: (search || undefined) as any,
    status: (status as "active" | "terminated" | "suspended" | "on_leave") || undefined,
    pageSize: 50,
  } as any);

  const bulkCreate = api.employee.bulkCreate.useMutation({
    onSuccess: (result) => {
      utils.employee.list.invalidate();
      const firstError = result.errors[0];
      setImportMessage(
        firstError
          ? `Imported ${result.created.length} employees. ${result.errors.length} rows need correction. First issue: row ${firstError.row} - ${firstError.message}`
          : `Imported ${result.created.length} employees successfully.`,
      );
    },
    onError: (error) => setImportMessage(error.message),
  });

  async function handleEmployeeUpload(file: File | null) {
    if (!file) return;
    try {
      const rows = parseEmployeeCsv(await file.text());
      setImportMessage(`Importing ${rows.length} employees...`);
      bulkCreate.mutate({ rows });
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Could not read the upload file.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage employee records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={downloadEmployeeSample}>
            <Download className="mr-2 h-4 w-4" /> Sample CSV
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
            <Upload className="h-4 w-4" /> Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                handleEmployeeUpload(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="mr-2 h-4 w-4" /> New Employee
            </Link>
          </Button>
        </div>
      </div>

      {importMessage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {bulkCreate.isPending ? "Importing employees..." : importMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
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
              ) : data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((employee: any) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${employee.fullName}`}
                    onClick={() => router.push(`/employees/${employee.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/employees/${employee.id}`);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{employee.fullName}</TableCell>
                    <TableCell>{employee.department?.name ?? "-"}</TableCell>
                    <TableCell className="capitalize">{employee.nationality}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColors[employee.employmentStatus] ?? "outline"}
                        className={customColors[employee.employmentStatus] ?? ""}
                      >
                        {employee.employmentStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/employees/${employee.id}`);
                        }}
                      >
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
    </div>
  );
}
