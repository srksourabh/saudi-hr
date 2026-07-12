"use client";

import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@hrms-app/ui";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { User, CalendarCheck, FileText } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: user } = api.user.me.useQuery();
  const { data: leaveRequests } = api.leave.request.my.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Your account and employee information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{session?.user?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{session?.user?.email ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{(session?.user?.role ?? "employee").replace("_", " ")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Quick Links
            </CardTitle>
            <CardDescription>Access your HR resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/leave"
              className="flex items-center gap-3 rounded-md border p-3 text-sm font-medium hover:bg-accent"
            >
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              My Leave Requests
              {leaveRequests && leaveRequests.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{leaveRequests.length} request(s)</span>
              )}
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-3 rounded-md border p-3 text-sm font-medium hover:bg-accent"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              My Documents
            </Link>
          </CardContent>
        </Card>
      </div>

      {user?.employeeId && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Employee Record</CardTitle>
            <CardDescription>Your profile is linked to an employee record</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/employees/${user.employeeId}`}>View My Employee Record</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


