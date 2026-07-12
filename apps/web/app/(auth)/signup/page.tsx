"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@hrms-app/ui";
import { signupSchema } from "@hrms-app/validators";
import { Landmark, Globe } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [regulatoryContext, setRegulatoryContext] = useState<"saudi" | "india">("saudi");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const result = signupSchema.safeParse({ name, email, password, companyName, crNumber, regulatoryContext });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrors({ form: data.error ?? "Something went wrong" });
      setLoading(false);
      return;
    }

    router.push("/login?registered=true");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-stone-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-800 shadow-sm">
            <span className="text-xl font-bold text-white">U</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">UDS-HR</h1>
          <p className="text-sm text-slate-500">Create your company account</p>
        </div>

        <Card className="border border-slate-200/60 bg-white shadow-md">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-semibold text-slate-900">Get started</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Set up your company HR account in minutes
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {errors.form && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{errors.form}</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Regulatory Context</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegulatoryContext("saudi")}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-colors ${
                      regulatoryContext === "saudi"
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Landmark className="h-5 w-5" />
                    <span className="text-sm font-semibold">Saudi Arabia</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Saudi labor law, GOSI, Qiwa, Nitaqat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegulatoryContext("india")}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-colors ${
                      regulatoryContext === "india"
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-sm font-semibold">India</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Indian labor law, EPF, ESI</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Name</label>
                <Input id="companyName" placeholder="Your Company Ltd." value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-700/40" />
                {errors.companyName && <p className="text-xs text-red-600">{errors.companyName}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="crNumber" className="text-sm font-medium text-slate-700">CR Number</label>
                <Input id="crNumber" placeholder="Commercial Registration number" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-700/40" />
                {errors.crNumber && <p className="text-xs text-red-600">{errors.crNumber}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">Your Name</label>
                <Input id="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-700/40" />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-700/40" />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <Input id="password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-amber-700/40" />
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit"
                className="w-full h-10 bg-amber-800 text-white font-medium hover:bg-amber-900 active:bg-amber-950"
                disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="text-center pt-1">
                <Button variant="link" className="text-sm text-slate-500 hover:text-slate-700" asChild>
                  <a href="/login">Already have an account? Sign in</a>
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-400">
          UDS-HR v1.0 &mdash; Saudi HR & Payroll Platform
        </p>
      </div>
    </div>
  );
}
