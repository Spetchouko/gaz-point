"use client";

import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell";
import type { DashboardUser } from "@/lib/auth-session";

export function DashboardClientLayout({
  children,
  session,
  status,
}: {
  children: React.ReactNode;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
}) {
  return (
    <DashboardShell role="client" session={session} status={status}>
      {children}
    </DashboardShell>
  );
}
