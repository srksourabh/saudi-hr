"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users, LayoutDashboard, Settings, Building2, Briefcase,
  ClipboardCheck, CalendarCheck, FileText, UserPlus,
  HeartHandshake, Brain, Landmark,
} from "lucide-react";
import { useRegulatoryContext } from "~/lib/regulatory-context";
import { t } from "~/lib/i18n";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { regulatoryContext, preferredLanguage } = useRegulatoryContext();
  const lang = preferredLanguage;

  const baseNav = [
    { href: "/employees", label: t("nav.dashboard", lang), icon: LayoutDashboard },
    { href: "/employees", label: t("nav.employees", lang), icon: Users },
    { href: "/departments", label: t("nav.departments", lang), icon: Building2 },
    { href: "/leave", label: t("nav.leave", lang), icon: CalendarCheck },
    { href: "/payroll", label: t("nav.payroll", lang), icon: Briefcase },
    { href: "/documents", label: t("nav.documents", lang), icon: FileText },
  ];

  const secondaryNav = [
    { href: "/recruitment", label: t("nav.recruitment", lang), icon: UserPlus },
    { href: "/compliance", label: t("nav.compliance", lang), icon: ClipboardCheck },
    { href: "/retention", label: t("nav.retention", lang), icon: HeartHandshake },
    { href: "/ai", label: t("nav.ai", lang), icon: Brain },
  ];

  const navItems = user.role === "super_admin" || user.role === "hr_manager"
    ? [...baseNav, ...secondaryNav, { href: "/settings", label: t("nav.settings", lang), icon: Settings }]
    : [
        { href: "/employees", label: t("nav.dashboard", lang), icon: LayoutDashboard },
        { href: "/employees", label: t("nav.employees", lang), icon: Users },
        { href: "/leave", label: t("nav.leave", lang), icon: CalendarCheck },
        { href: "/documents", label: t("nav.documents", lang), icon: FileText },
      ];

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-800 shadow-sm">
            <span className="text-sm font-bold text-white">U</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 leading-tight">
              {regulatoryContext === "saudi" ? "UDS-HR" : "UDS-HR"}
            </h2>
            <p className="text-xs font-medium text-slate-500 capitalize">
              {regulatoryContext === "saudi" ? "Saudi HR" : "India HR"}
              {" · "}
              {user.role?.replace("_", " ") ?? "employee"}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-50 text-amber-800 border-l-[3px] border-amber-800 pl-[calc(0.75rem-3px)]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t("nav.signOut", lang)}
          </button>
        </form>
      </div>
    </aside>
  );
}
