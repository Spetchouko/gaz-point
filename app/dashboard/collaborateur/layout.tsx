"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { CollaborateurLayout } from "@/app/_components/dashboard/collaborateur-layout";
import { authClient } from "@/lib/auth-client";

const ALL_MODULES = [
  "utilisateurs",
  "clients",
  "vendeurs",
  "disponibilites",
  "reservations",
  "publicite",
  "collaborateurs",
  "marketing",
  "avis",
  "statistiques",
] as const;

export default function DashboardCollaborateurLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = authClient.useSession();
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "loading") {
      if (!session?.user) {
        redirect("/connexion-admin");
      } else {
        const role = (session.user as { role?: string }).role;
        // Allow both admin and collaborateur
        if (role === "admin" || role === "collaborateur") {
          // Fetch permissions from API
          fetch("/api/user/permissions", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to fetch permissions");
              return res.json();
            })
            .then((data) => {
              if (data.role === "admin") {
                setPermissions(new Set(ALL_MODULES));
              } else {
                setPermissions(new Set(data.permissions || []));
              }
              setIsStaff(true);
            })
            .catch(() => {
              redirect("/connexion-admin");
            });
        } else {
          redirect("/dashboard");
        }
      }
    }
  }, [session, status]);

  if (isStaff === null) {
    return null;
  }

  return <CollaborateurLayout permissions={permissions}>{children}</CollaborateurLayout>;
}