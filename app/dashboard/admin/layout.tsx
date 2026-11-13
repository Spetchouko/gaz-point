"use client";
import { useEffect, useState } from "react";
import { DashboardAdminLayout } from "@/app/_components/dashboard/admin-layout";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function DashboardAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = authClient.useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "loading") {
      if (!session?.user) {
        redirect("/connexion");
      } else if ((session.user as { role?: string }).role !== "admin") {
        redirect("/dashboard");
      } else {
        setIsAdmin(true);
      }
    }
  }, [session, status]);

  if (isAdmin === null) {
    return null;
  }

  return <DashboardAdminLayout>{children}</DashboardAdminLayout>;
}
