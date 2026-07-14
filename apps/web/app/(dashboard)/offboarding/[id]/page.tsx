"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock,
  KeyRound,
  Laptop,
  LogOut,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export default function OffboardingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const utils = api.useUtils();
  const payload = api.settlement.offboarding.getPayload.useQuery({ settlementId: id });
  const complete = api.settlement.offboarding.complete.useMutation({
    onSuccess: () => utils.settlement.offboarding.getPayload.invalidate(),
  });
  const addKt = api.settlement.offboarding.addKtItem.useMutation({
    onSuccess: () => utils.settlement.offboarding.getPayload.invalidate(),
  });
  const addAsset = api.settlement.offboarding.addAssetReturn.useMutation({
    onSuccess: () => utils.settlement.offboarding.getPayload.invalidate(),
  });
  const recordInterview = api.settlement.offboarding.recordExitInterview.useMutation({
    onSuccess: () => utils.settlement.offboarding.getPayload.invalidate(),
  });

  // KT form state
  const [task, setTask] = useState("");
  const [successor, setSuccessor] = useState("");
  const [interimOwner, setInterimOwner] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Asset form state
  const [assetType, setAssetType] = useState<"laptop" | "phone" | "id_card" | "parking" | "uniform" | "keys" | "other">("laptop");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetStatus, setAssetStatus] = useState<"pending" | "returned" | "lost">("pending");

  // Exit interview state
  const [interview, setInterview] = useState({
    conductedBy: "",
    date: new Date().toISOString().slice(0, 10),
    primaryReason: "resignation" as const,
    satisfaction: 4,
    wouldRecommend: true,
    rehireEligibility: "yes" as "yes" | "no" | "conditional",
    rehireReason: "",
    highlights: "",
    concerns: "",
  });

  if (payload.isLoading) {
    return <div className="p-10 text-slate-500">Loading offboarding…</div>;
  }

  if (!payload.data) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card>
          <CardContent className="py-10 text-center">
            <CircleAlert className="mx-auto mb-3 h-8 w-8 text-rose-500" />
            <p className="text-sm font-medium">Offboarding not found</p>
            <Link href="/offboarding" className="mt-4 inline-block">
              <Button>Back to list</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { settlement, offboarding } = payload.data;
  const ob = offboarding as {
    initiatedBy?: string;
    initiatedAt?: string;
    lastWorkingDay?: string;
    primaryReason?: string;
    ktItems?: Array<{ task: string; successor: string; interimOwner?: string; dueDate: string; status: string; notes?: string }>;
    assetReturns?: Array<{ asset: string; serial?: string; status: string; returnedAt?: string }>;
    itRevocations?: Array<{ system: string; scheduledFor: string; revokedAt?: string; status: string }>;
    exitInterview?: {
      conductedBy: string;
      date: string;
      primaryReason: string;
      satisfaction: number;
      wouldRecommend: boolean;
      rehireEligibility: "yes" | "no" | "conditional";
      rehireReason?: string;
      highlights?: string;
      concerns?: string;
    } | null;
    completedAt?: string;
  };

  const isComplete = Boolean(ob.completedAt);
  const employeeName = (settlement as any).employee?.fullName ?? "Employee";

  function onAddKt(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !successor || !dueDate) return;
    addKt.mutate({
      settlementId: id,
      item: {
        task,
        successor,
        interimOwner: interimOwner || undefined,
        dueDate,
        status: "pending",
      },
    });
    setTask("");
    setSuccessor("");
    setInterimOwner("");
    setDueDate("");
  }

  function onAddAsset(e: React.FormEvent) {
    e.preventDefault();
    addAsset.mutate({
      settlementId: id,
      asset: {
        asset: assetType,
        serial: assetSerial || undefined,
        status: assetStatus,
        returnedAt: assetStatus === "returned" ? new Date().toISOString() : undefined,
      },
    });
    setAssetSerial("");
  }

  function onRecordInterview(e: React.FormEvent) {
    e.preventDefault();
    if (!interview.conductedBy) return;
    recordInterview.mutate({ settlementId: id, interview });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/offboarding")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> All offboardings
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{employeeName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {ob.primaryReason ?? "—"} · initiated {ob.initiatedAt ? new Date(ob.initiatedAt).toLocaleDateString("en-GB") : "—"} · last working day {ob.lastWorkingDay ?? "—"}
            </p>
          </div>
        </div>
        {isComplete ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Completed
          </span>
        ) : (
          <Button
            onClick={() => complete.mutate({ settlementId: id })}
            disabled={complete.isPending || !ob.exitInterview}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark complete
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* KT Handover */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-emerald-700" /> Knowledge-transfer handover
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ob.ktItems && ob.ktItems.length > 0 ? (
              <ul className="space-y-3">
                {ob.ktItems.map((k, idx) => (
                  <li key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{k.task}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Successor: <strong>{k.successor}</strong>
                      {k.interimOwner ? ` · Interim: ${k.interimOwner}` : ""} · Due {k.dueDate} · {k.status.replace("_", " ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No handover tasks added yet.</p>
            )}

            {!isComplete && (
              <form onSubmit={onAddKt} className="space-y-3 border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="task">Open task *</Label>
                    <Input id="task" value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Handover vendor relationships" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="successor">Successor *</Label>
                    <Input id="successor" value={successor} onChange={(e) => setSuccessor(e.target.value)} placeholder="Name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="interimOwner">Interim owner</Label>
                    <Input id="interimOwner" value={interimOwner} onChange={(e) => setInterimOwner(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="dueDate">Due date *</Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" disabled={addKt.isPending || !task || !successor || !dueDate}>
                  Add handover task
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Asset returns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Laptop className="h-5 w-5 text-emerald-700" /> Asset returns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ob.assetReturns && ob.assetReturns.length > 0 ? (
              <ul className="space-y-2">
                {ob.assetReturns.map((a, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="font-semibold capitalize text-slate-900">{a.asset.replace("_", " ")}</p>
                      <p className="text-xs text-slate-500">Serial: {a.serial ?? "—"}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No assets recorded yet.</p>
            )}

            {!isComplete && (
              <form onSubmit={onAddAsset} className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div className="space-y-1.5 col-span-1">
                  <Label>Asset</Label>
                  <Select value={assetType} onValueChange={(v: any) => setAssetType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="id_card">ID card</SelectItem>
                      <SelectItem value="parking">Parking pass</SelectItem>
                      <SelectItem value="uniform">Uniform / PPE</SelectItem>
                      <SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label>Status</Label>
                  <Select value={assetStatus} onValueChange={(v: any) => setAssetStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="serial">Serial / tag number</Label>
                  <Input id="serial" value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)} />
                </div>
                <Button type="submit" disabled={addAsset.isPending} className="col-span-2">
                  Record asset
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* IT Revocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-5 w-5 text-amber-700" /> IT access revocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(ob.itRevocations ?? []).map((it, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{it.system}</p>
                    <p className="text-xs text-slate-500">
                      Scheduled {it.scheduledFor}
                      {it.revokedAt ? ` · revoked ${new Date(it.revokedAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    it.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {it.status}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Production: triggered via Qiwa contract termination + identity-provider webhook.
            </p>
          </CardContent>
        </Card>

        {/* Exit interview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-emerald-700" /> Exit interview &amp; rehire eligibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ob.exitInterview ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Conducted by</p>
                    <p className="font-semibold">{ob.exitInterview.conductedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-semibold">{ob.exitInterview.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Reason</p>
                    <p className="font-semibold capitalize">{ob.exitInterview.primaryReason.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Satisfaction</p>
                    <p className="font-semibold">{"★".repeat(ob.exitInterview.satisfaction)}<span className="text-slate-300">{"★".repeat(5 - ob.exitInterview.satisfaction)}</span> ({ob.exitInterview.satisfaction}/5)</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Would recommend</p>
                    <p className="font-semibold">{ob.exitInterview.wouldRecommend ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Rehire eligibility</p>
                    <p className="font-semibold capitalize">
                      {ob.exitInterview.rehireEligibility}
                      {ob.exitInterview.rehireReason ? ` — ${ob.exitInterview.rehireReason}` : ""}
                    </p>
                  </div>
                </div>
                {ob.exitInterview.highlights && (
                  <div>
                    <p className="text-xs text-slate-500">Highlights</p>
                    <p className="text-sm text-slate-700">{ob.exitInterview.highlights}</p>
                  </div>
                )}
                {ob.exitInterview.concerns && (
                  <div>
                    <p className="text-xs text-slate-500">Concerns</p>
                    <p className="text-sm text-slate-700">{ob.exitInterview.concerns}</p>
                  </div>
                )}
              </div>
            ) : !isComplete ? (
              <form onSubmit={onRecordInterview} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="conductedBy">Conducted by *</Label>
                    <Input id="conductedBy" value={interview.conductedBy} onChange={(e) => setInterview({ ...interview, conductedBy: e.target.value })} placeholder="HR name" />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label htmlFor="idate">Date *</Label>
                    <Input id="idate" type="date" value={interview.date} onChange={(e) => setInterview({ ...interview, date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label>Primary reason</Label>
                    <Select value={interview.primaryReason} onValueChange={(v: any) => setInterview({ ...interview, primaryReason: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resignation">Resignation</SelectItem>
                        <SelectItem value="termination">Termination</SelectItem>
                        <SelectItem value="end_of_contract">End of contract</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label>Satisfaction (1–5)</Label>
                    <Select value={String(interview.satisfaction)} onValueChange={(v) => setInterview({ ...interview, satisfaction: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label>Would recommend</Label>
                    <Select value={interview.wouldRecommend ? "yes" : "no"} onValueChange={(v) => setInterview({ ...interview, wouldRecommend: v === "yes" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <Label>Rehire eligibility</Label>
                    <Select value={interview.rehireEligibility} onValueChange={(v: any) => setInterview({ ...interview, rehireEligibility: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="conditional">Conditional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rehireReason">Rehire reason / condition</Label>
                  <Input id="rehireReason" value={interview.rehireReason} onChange={(e) => setInterview({ ...interview, rehireReason: e.target.value })} placeholder="Optional context" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="highlights">Highlights</Label>
                  <Textarea id="highlights" rows={2} value={interview.highlights} onChange={(e) => setInterview({ ...interview, highlights: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="concerns">Concerns</Label>
                  <Textarea id="concerns" rows={2} value={interview.concerns} onChange={(e) => setInterview({ ...interview, concerns: e.target.value })} />
                </div>
                <Button type="submit" disabled={recordInterview.isPending || !interview.conductedBy}>
                  Save exit interview
                </Button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">No exit interview captured.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Final settlement preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-5 w-5 text-emerald-700" /> Final settlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            ESB, accrued leave payout and unpaid salary are calculated per PRD §8.3 (tenure brackets)
            and §10.1 (data retention). Production wires the formula against this settlement row
            and freezes the figures on completion.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: "ESB", value: settlement.esbAmount ?? "—" },
              { label: "Accrued leave payout", value: settlement.accruedLeavePayout ?? "—" },
              { label: "Unpaid salary", value: settlement.unpaidSalary ?? "—" },
              { label: "Currency", value: "SAR" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{String(item.value)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="h-3.5 w-3.5" /> Settlement status: <strong className="capitalize text-slate-700">{settlement.esbAmount ? "calculated" : "draft"}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}