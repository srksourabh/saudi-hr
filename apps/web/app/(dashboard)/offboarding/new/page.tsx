"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@hrms-app/ui";
import { api } from "~/trpc/react";
import { ArrowLeft, LogOut, Save } from "lucide-react";

export default function NewOffboardingPage() {
  const router = useRouter();
  const employees = api.employee.list.useQuery({ status: "active" });
  const [submitting, setSubmitting] = useState(false);

  const [employeeId, setEmployeeId] = useState("");
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [primaryReason, setPrimaryReason] = useState<"resignation" | "termination" | "end_of_contract" | "retirement" | "transfer" | "other">("resignation");
  const [notes, setNotes] = useState("");

  const initiate = api.settlement.offboarding.initiate.useMutation({
    onSuccess: (result: any) => {
      if (result?.id) router.push(`/offboarding/${result.id}`);
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !lastWorkingDay) return;
    setSubmitting(true);
    try {
      await initiate.mutateAsync({
        employeeId,
        lastWorkingDay,
        primaryReason,
        initiatedBy: notes || "HR system",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Initiate offboarding</h1>
          <p className="mt-1 text-sm text-slate-500">
            Start a structured offboarding workflow for an active employee. KT handover, asset return,
            IT revocation and final settlement are tracked here.
          </p>
        </div>
        <Button type="submit" disabled={submitting || !employeeId || !lastWorkingDay}>
          <Save className="mr-2 h-4 w-4" />
          {submitting ? "Initiating…" : "Initiate"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-amber-700" /> Employee and reason
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Active employee *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {(employees.data ?? []).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fullName} — {e.position ?? e.role ?? "Team member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastWorkingDay">Last working day *</Label>
              <Input
                id="lastWorkingDay"
                type="date"
                required
                value={lastWorkingDay}
                onChange={(e) => setLastWorkingDay(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primaryReason">Primary reason *</Label>
            <Select value={primaryReason} onValueChange={(v: any) => setPrimaryReason(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resignation">Resignation</SelectItem>
                <SelectItem value="termination">Termination</SelectItem>
                <SelectItem value="end_of_contract">End of contract</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="transfer">Internal transfer / secondment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (initiated by / reason detail)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="e.g. Initiated by Reem Al-Harbi — accepted counter-offer, transition completed 30 days"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>1. Knowledge-transfer handover is set up with a named successor or interim owner per open task.</p>
          <p>2. Asset return is tracked (laptop, phone, ID card, parking, uniform, keys).</p>
          <p>3. IT access revocation is scheduled for the last working day (email, SSO, VPN, HR portal).</p>
          <p>4. Exit interview captures the primary reason, satisfaction, recommendation, and rehire eligibility (yes/no/conditional).</p>
          <p>5. Final settlement (ESB, accrued leave, unpaid salary) is auto-calculated per Section 8.3 tenure brackets.</p>
          <p>6. Muqeem final-exit evidence is queued for completion once IT revocations are confirmed.</p>
        </CardContent>
      </Card>
    </form>
  );
}