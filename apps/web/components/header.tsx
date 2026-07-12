"use client";

import Link from "next/link";
import { Bell, ChevronDown, Command, Globe2, Menu, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hrms-app/ui";
import { useRegulatoryContext } from "~/lib/regulatory-context";

interface HeaderProps {
  user: { name?: string | null; email?: string | null };
  onOpenMenu?: () => void;
}

export function Header({ user, onOpenMenu }: HeaderProps) {
  const { preferredLanguage, setPreferredLanguage } = useRegulatoryContext();
  const isArabic = preferredLanguage === "ar";
  const today = new Date().toLocaleDateString(isArabic ? "ar-SA" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200/80 bg-[#f7f7f4]/90 px-4 backdrop-blur-xl sm:px-6">
      <button type="button" onClick={onOpenMenu} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      <Link href="/modules" className="group hidden h-11 min-w-0 max-w-md flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-400 transition hover:border-emerald-800/25 hover:text-slate-700 sm:flex">
        <Search className="h-4 w-4" />
        <span className="truncate">{isArabic ? "ابحث في الموظفين والوحدات والمهام" : "Search people, modules and actions"}</span>
        <span className="ml-auto hidden items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400 lg:flex"><Command className="h-3 w-3" />K</span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        <span className="hidden px-2 text-xs font-medium text-slate-400 xl:inline">{today}</span>
        <button type="button" onClick={() => setPreferredLanguage(isArabic ? "en" : "ar")} className="flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950">
          <Globe2 className="h-4 w-4" /><span className="hidden sm:inline">{isArabic ? "English" : "العربية"}</span>
        </button>
        <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#f7f7f4] bg-amber-500" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-300">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#071b14] text-xs font-bold text-white">{user.name?.[0]?.toUpperCase() ?? "U"}</span>
            <span className="hidden max-w-28 truncate lg:inline">{user.name ?? "HR Manager"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">{user.name ?? "HR Manager"}</p>
              <p className="mt-0.5 truncate text-xs font-normal text-slate-400">{user.email ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl"><Link href="/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl"><Link href="/settings">Settings</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
