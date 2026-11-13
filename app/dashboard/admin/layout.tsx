"use client";

import { DashboardAdminLayout } from "@/app/_components/dashboard/admin-layout";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function DashboardAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const user = session?.user as { role?: string | null } | undefined;
    if (user && user.role !== "admin") {
      redirect("/dashboard");
    }
    setIsAdmin(user?.role === "admin");
  }, [session?.user]);

  if (isAdmin === null) {
    return null;
  }

  return <DashboardAdminLayout>{children}</DashboardAdminLayout>;
}
