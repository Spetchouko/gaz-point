"use client";
import { useEffect, useState } from "react";
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function DashboardClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
      if (!session?.user) {
        redirect("/connexion");
      }
    }
  }, [session, status]);

  if (isLoading) {
    return null;
  }

  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
