"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/app/_components/spinner";
import { redirect } from "next/navigation";
import { DashboardAdminLayout } from "@/app/_components/dashboard/admin-layout";
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

export default function DashboardAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = authClient.useSession();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "loading") {
      // Session encore en cours de restauration : on attend, on ne redirige pas.
      return;
    }
    if (!session?.user) {
      redirect("/connexion-admin");
    } else {
      const role = (session.user as { role?: string }).role;
      // Allow both admin and collaborateur
      if (role === "admin" || role === "collaborateur") {
        // Fetch permissions for collaborateur
        if (role === "collaborateur") {
          fetch("/api/user/permissions", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to fetch permissions");
              return res.json();
            })
            .then((data) => {
              setPermissions(new Set(data.permissions || []));
            })
            .catch(() => {
              redirect("/connexion-admin");
            });
        } else {
          // Admin has all permissions
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPermissions(new Set(ALL_MODULES));
        }
      } else {
        redirect("/dashboard");
      }
    }
  }, [session, status]);

  // Pendant la restauration de la session, afficher un loader au lieu de
  // retourner null (écran blanc puis flash de connexion).
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return <DashboardAdminLayout permissions={permissions}>{children}</DashboardAdminLayout>;
}
