"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { Send, Sparkles, Bot, User, Loader2, ChevronDown, AlertCircle } from "lucide-react";

const TOPICS = [
  { value: "general", label: "General HR" },
  { value: "saudi_statutory", label: "Saudi Law" },
  { value: "leave_policy", label: "Leave" },
  { value: "payroll", label: "Payroll / GOSI" },
  { value: "expense_policy", label: "Expenses" },
  { value: "recruitment", label: "Recruitment" },
  { value: "onboarding", label: "Onboarding" },
  { value: "performance", label: "Performance" },
] as const;

type Topic = (typeof TOPICS)[number]["value"];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "llm" | "stub";
  topic?: Topic;
  ts: number;
};

const SUGGESTED: { topic: Topic; text: string }[] = [
  { topic: "saudi_statutory", text: "How many days of annual leave is a Saudi employee entitled to?" },
  { topic: "payroll", text: "What's the GOSI split for a Saudi national on the new system?" },
  { topic: "expense_policy", text: "Can I reimburse client entertainment without pre-approval?" },
  { topic: "leave_policy", text: "What happens to unused leave at end of service?" },
  { topic: "recruitment", text: "What Nitaqat band does a logistics company need?" },
  { topic: "onboarding", text: "Walk me through Iqama + GOSI registration in week 1." },
];

export default function AIChatPage() {
  const session = api.auth.session.useQuery();
  const lang = (session.data?.user?.preferredLanguage ?? "en") as "en" | "ar";
  const isArabic = lang === "ar";
  const [topic, setTopic] = useState<Topic>("general");
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "m0",
      role: "assistant",
      content: isArabic
        ? "**مرحبًا!** أنا المساعد الذكي لـ Taāzur. اسأل عن نظام العمل، الرواتب، GOSI، منصة قوى، Mudad، أو أي موضوع موارد بشرية سعودي. كل الردود تستشهد بالمصدر."
        : "**Welcome!** I'm the Taāzur AI assistant. Ask me about Saudi Labour Law, GOSI, payroll, Qiwa, Mudad, leave, expenses, or any other Saudi HR topic. Every answer is cited.",
      source: "stub",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const send = api.ai.chat.send.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.reply, source: data.source as "llm" | "stub", ts: Date.now() },
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: "assistant",
          content: `**Error:** ${err.message}`,
          source: "stub",
          ts: Date.now(),
        },
      ]);
    },
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function submit(text: string, useTopic: Topic = topic) {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed, topic: useTopic, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    send.mutate({
      messages: [...messages, { role: "user" as const, content: trimmed }].map((m) => ({
        role: m.role,
        content: m.content,
      })),
      topic: useTopic,
    });
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950">Taāzur AI</h1>
            <p className="text-xs text-slate-500">
              {isArabic
                ? "مساعد ذكاء اصطناعي للسياسات السعودية، مدعوم بـ Claude أو Gemini، مع سياق مباشر من قاعدة بياناتك."
                : "Native AI assistant for Saudi HR & payroll, backed by Claude or Gemini, with live context from your Supabase tenant."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500">{isArabic ? "الموضوع:" : "Topic:"}</label>
          <div className="relative">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as Topic)}
              className="appearance-none rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </section>

      {/* Thread */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div ref={scrollRef} className="h-[480px] space-y-3 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  m.role === "user"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-50 text-slate-800 ring-1 ring-slate-200"
                }`}
              >
                <MarkdownLite text={m.content} />
                {m.source === "stub" && m.role === "assistant" && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                    <AlertCircle className="h-2.5 w-2.5" /> {isArabic ? "وضع تجريبي (أضف GEMINI_API_KEY)" : "Demo mode (set GEMINI_API_KEY)"}
                  </p>
                )}
              </div>
              {m.role === "user" && (
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300 text-amber-900">
                  <User className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))}
          {send.isPending && (
            <div className="flex gap-3">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                {isArabic ? "يفكّر..." : "Thinking..."}
              </div>
            </div>
          )}
        </div>

        {/* Suggested */}
        {messages.length <= 1 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isArabic ? "جرّب" : "Try asking"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTED.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => submit(s.text, s.topic)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-center gap-2 border-t border-slate-200 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isArabic ? "اسأل Taāzur AI عن الموارد البشرية في السعودية..." : "Ask Taāzur AI about Saudi HR..."}
            className="flex h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
          />
          <button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isArabic ? "إرسال" : "Send"}
          </button>
        </form>
      </section>

      <p className="text-[11px] text-slate-400">
        {isArabic
          ? "كل محادثة تُسجَّل في سجل تدقيق الذكاء الاصطناعي للامتثال. لا تُرسل بيانات حساسة (مثل أرقام الإقامة أو الحسابات) إلى النموذج."
          : "Every chat is recorded in the AI audit log for compliance. Do not paste sensitive identifiers (Iqama numbers, IBANs) into the prompt."}
      </p>
    </div>
  );
}

function MarkdownLite({ text }: { text: string }) {
  // Lightweight markdown: paragraphs, **bold**, lists
  const parts = text.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <div className="space-y-1.5">
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("* ") || part.startsWith("- ")) {
          return <div key={i} className="ml-4 flex gap-2"><span>•</span><span>{part.slice(2)}</span></div>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}