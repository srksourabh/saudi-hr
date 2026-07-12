"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Brain,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChevronRight,
  CircleUserRound,
  FileText,
  Grid2X2,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useRegulatoryContext } from "~/lib/regulatory-context";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  onNavigate?: () => void;
}

const navGroups = [
  {
    label: "Command",
    labelAr: "القيادة",
    items: [
      { href: "/", label: "Command center", labelAr: "مركز القيادة", icon: LayoutDashboard },
      { href: "/modules", label: "All PRD modules", labelAr: "جميع الوحدات", icon: Grid2X2 },
    ],
  },
  {
    label: "Workforce",
    labelAr: "القوى العاملة",
    items: [
      { href: "/employees", label: "People", labelAr: "الموظفون", icon: Users },
      { href: "/departments", label: "Organization", labelAr: "الهيكل التنظيمي", icon: Building2 },
      { href: "/leave", label: "Time & leave", labelAr: "الوقت والإجازات", icon: CalendarCheck },
      { href: "/payroll", label: "Payroll", labelAr: "الرواتب", icon: BriefcaseBusiness },
      { href: "/documents", label: "Documents", labelAr: "المستندات", icon: FileText },
    ],
  },
  {
    label: "Talent",
    labelAr: "المواهب",
    items: [
      { href: "/recruitment", label: "Recruitment", labelAr: "التوظيف", icon: CircleUserRound },
      { href: "/retention", label: "Performance & growth", labelAr: "الأداء والنمو", icon: HeartHandshake },
      { href: "/modules/engagement-retention", label: "Engagement", labelAr: "المشاركة", icon: BarChart3 },
    ],
  },
  {
    label: "Saudi & AI",
    labelAr: "السعودية والذكاء",
    items: [
      { href: "/compliance", label: "Compliance", labelAr: "الامتثال", icon: ShieldCheck },
      { href: "/qiwa", label: "Qiwa workspace", labelAr: "منصة قوى", icon: Landmark },
      { href: "/ai", label: "AI intelligence", labelAr: "الذكاء الاصطناعي", icon: Brain },
    ],
  },
];

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { preferredLanguage } = useRegulatoryContext();
  const isArabic = preferredLanguage === "ar";

  return (
    <aside className="flex h-screen w-[278px] shrink-0 flex-col overflow-hidden bg-[#071b14] text-white">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white text-base font-bold text-emerald-950">
            U
            <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-[-0.03em]">UDS-HR</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/55">
              Saudi people OS
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            <div>
              <p className="text-xs font-medium text-white">Saudi workspace</p>
              <p className="text-[10px] text-white/40">Kingdom-ready configuration</p>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-amber-300" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.12)_transparent]">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
              {isArabic ? group.labelAr : group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-white text-emerald-950"
                        : "text-white/58 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-emerald-800" : "text-white/42 group-hover:text-amber-300"}`} />
                    <span className="flex-1 truncate font-medium">{isArabic ? item.labelAr : item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-emerald-700 rtl-flip" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/55 transition hover:bg-white/[0.07] hover:text-white"
        >
          <Settings className="h-[18px] w-[18px]" />
          <span className="flex-1">{isArabic ? "الإعدادات" : "Settings"}</span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-xs font-bold text-emerald-950">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.name ?? "HR Manager"}</p>
            <p className="truncate text-[10px] text-white/40">{user.role?.replaceAll("_", " ") ?? "employee"}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-white/35 transition hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}