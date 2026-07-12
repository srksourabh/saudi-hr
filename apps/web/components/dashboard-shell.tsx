"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { RegulatoryContext } from "~/lib/regulatory-context";
import type { Lang } from "~/lib/i18n";

interface DashboardShellProps {
  user: any;
  regulatoryContext: "saudi" | "india";
  preferredLanguage: Lang;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  regulatoryContext,
  preferredLanguage: initialLang,
  children,
}: DashboardShellProps) {
  const [preferredLanguage, setPreferredLanguage] = useState<Lang>(initialLang);

  const handleSetLanguage = useCallback((lang: Lang) => {
    setPreferredLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, []);

  return (
    <RegulatoryContext.Provider
      value={{ regulatoryContext, preferredLanguage, setPreferredLanguage: handleSetLanguage }}
    >
      <div className="flex min-h-screen bg-stone-50">
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col">
          <Header user={user} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </RegulatoryContext.Provider>
  );
}
