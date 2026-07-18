"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";
import { WebVitalsReporter } from "~/components/web-vitals-reporter";

export function DashboardProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  return (
    <SessionProvider session={session}>
      <TRPCReactProvider>
        <WebVitalsReporter />
        {children}
      </TRPCReactProvider>
    </SessionProvider>
  );
}
