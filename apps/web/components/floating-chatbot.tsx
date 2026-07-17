"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

const USER_MANUAL_PROMPT = `You are Taazur Support, the in-app help assistant for the Taazur HR & payroll platform. You ONLY answer questions about how to use Taazur — never about specific customers, employees, salaries, attendance records, or any data from a customer tenant.

When the user asks how to do something, give a short, actionable answer with the exact navigation path (e.g. "Go to Attendance > My attendance, then click Punch in"). If they ask about a feature you don't know, point them to the relevant module.

Cover at least these topics:

1. SIGNING IN
- Sign in at /login with the email and password your administrator gave you.
- If you forgot your password, click "Forgot password?" on the login screen and follow the email reset link.
- To sign out, click your avatar in the top-right corner and choose Sign out.

2. NAVIGATION
- The left sidebar shows the workspaces available to your role (HR Manager, HR Specialist, Department Manager, Payroll Admin, Employee).
- The top header has notifications, language toggle (EN / العربية) and your profile menu.
- Every page has a back button at the top-left to return to the previous screen.

3. EMPLOYEES (HR Manager / HR Specialist)
- Go to People > Employees to browse, search, add or terminate an employee.
- Click "New Employee" to fill in name, nationality, hire date, department, salary (basic / housing / transport) and GOSI registration date.
- Each employee has a profile page with documents, leave history, payslips and attendance.

4. ATTENDANCE (all roles)
- Employees go to Attendance > My attendance to punch in / punch out.
- Punch-in captures the current GPS location and the local time.
- HR / managers go to Attendance > Dashboard to see the monthly summary for every employee.
- Exceptions (late arrival, missed punch-out, missing punch-in) are raised automatically and shown in the manager dashboard.

5. LEAVE
- Employees go to Time & leave > New Leave Request to file annual, sick, personal, or exam leave.
- Managers approve or reject requests from Time & leave > All requests.
- Leave balances are visible on the My leave page.

6. PAYROLL (HR Manager / Payroll Admin)
- Go to Payroll > New Payroll Run to calculate a period.
- The system applies GOSI, SANED, occupational-hazards, EOSB accrual and Mudad file generation automatically.
- After the run finishes, click into a payslip to view the breakdown (basic + housing + transport − GOSI = net).
- The Mudad wage file is generated for every completed run and can be downloaded from the payroll detail page.

7. PERFORMANCE (Department Manager / HR)
- Go to Performance > Goals to set quarterly goals for your direct reports.
- Go to Performance > Reviews to start or complete a performance review.
- Employees see their own goals and the latest review summary on Performance > My goals / My reviews.

8. ORGANOGRAM (HR Manager / Department Manager)
- Go to Departments > Organogram to see the reporting structure for every department.
- The chart shows direct manager, peers and direct reports; click a node to open the employee profile.

9. ORGANIZATION & DEPARTMENTS
- Departments > All Departments lists every business unit, headcount and budget.
- New departments can be created with name, parent department and head employee.

10. DOCUMENTS
- People > Documents lets HR upload employee documents (iqama, passport, contract, certificate).
- Document Renewal Agent raises alerts 90 / 60 / 30 / 7 days before each expiry.

11. COMPLIANCE (HR / Super Admin)
- Compliance workspace shows the latest GOSI / Qiwa / Mudad / Muqeem sync statuses.
- The compliance score combines Qiwa sync, GOSI current, Iqama expiries, open document-renewal alerts and last Mudad submission.

12. AI ASSISTANT
- Click the floating sparkle icon at the bottom-right to chat with Taazur AI.
- Ask any Saudi HR / payroll question; responses cite the relevant GOSI rate, Qiwa rule or Saudi Labour Law article.

13. SUPPORT
- For product support, contact support@taazur.example or open a ticket via the Help link in the user menu.
- For live training, see docs/customer-demo-manual inside the repository.

If the user asks a question unrelated to Taazur, politely redirect them back to the platform topics above.`;

const QUICK_TOPICS = [
  { label: "How do I punch in?",        text: "How do I punch in for the day? Where is the attendance button?" },
  { label: "How to file leave?",       text: "How do I file a new leave request as an employee?" },
  { label: "Run payroll",              text: "How does HR run a payroll period and download the Mudad wage file?" },
  { label: "Performance review",       text: "How does a department manager start a performance review?" },
  { label: "View organogram",          text: "Where can I see the company organogram and reporting lines?" },
  { label: "Forgot password",          text: "I forgot my password. How do I reset it?" },
];

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content: "Hi! I'm Taazur Support. Ask me how to use any feature in Taazur — sign-in, attendance, payroll, leave, performance, organogram, or AI assistant.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = api.ai.chat.send.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.reply, ts: Date.now() },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        { id: `a-err-${Date.now()}`, role: "assistant", content: `**Error:** ${err.message}`, ts: Date.now() },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: trimmed, ts: Date.now() }]);
    setInput("");
    send.mutate({
      messages: [
        { role: "system", content: USER_MANUAL_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: trimmed },
      ],
      topic: "general",
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close help" : "Open help"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-lg ring-1 ring-emerald-900/30 transition hover:shadow-2xl hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-[10px] font-bold text-emerald-950">?</span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[540px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between gap-3 bg-gradient-to-br from-emerald-700 to-emerald-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold">Taazur Help</div>
                <div className="text-[10px] text-emerald-100/80">How do I…?</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-3 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                    <Bot className="h-3 w-3" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 leading-snug ${
                    m.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <LiteMarkdown text={m.content} />
                </div>
                {m.role === "user" && (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-amber-900">
                    <User className="h-3 w-3" />
                  </span>
                )}
              </div>
            ))}
            {send.isPending && (
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Bot className="h-3 w-3" />
                </span>
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-slate-500">
                  <Loader2 className="mr-2 inline h-3 w-3 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Quick help
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => submit(q.text)}
                    disabled={send.isPending}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a Taazur question…"
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
            />
            <button
              type="submit"
              disabled={!input.trim() || send.isPending}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function LiteMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("- ")) {
          return <div key={i} className="ml-3 flex gap-1.5"><span>•</span><span>{part.slice(2)}</span></div>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
