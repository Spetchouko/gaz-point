"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell";
import { COLLABORATEUR_NAV_GROUPS } from "@/app/_components/dashboard/dashboard-nav";
import { useDashboardSession, useAutoRefreshSession } from "@/lib/auth-session";
import type { DashboardUser } from "@/lib/auth-session";
import type { SessionUser } from "@/lib/session";

interface CollaborateurClientLayoutProps {
  sessionUser: SessionUser;
  children: React.ReactNode;
}

export function DashboardCollaborateurClientLayout({
  sessionUser,
  children,
}: CollaborateurClientLayoutProps) {
  const { status, user, isAuthenticated, isLoading } = useDashboardSession();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Rafraîchir automatiquement la session au focus de la fenêtre
  useAutoRefreshSession();

  // Charger les permissions réelles depuis l'API protégée.
  useEffect(() => {
    let cancelled = false;
    async function loadPermissions() {
      try {
        const res = await fetch("/api/user/permissions", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setPermissions(
            new Set(
              Array.isArray(data.permissions) ? data.permissions : []
            )
          );
        }
      } catch {
        // En cas d'erreur, l'ensemble vide est utilisé et les modules
        // restent masqués pour le collaborateur.
      }
    }
    loadPermissions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Si la session est définitivement invalide (expiration en cours de navigation),
  // rediriger vers la connexion admin. Pendant le chargement, on affiche le contenu
  // pour éviter le clignotement : le middleware a déjà protégé la route côté serveur.
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !user) {
      router.push("/connexion-admin");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  const dashboardUser: DashboardUser | undefined = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image ?? null,
        role: sessionUser.role ?? null,
        emailVerified: sessionUser.emailVerified,
        isActive: sessionUser.isActive ?? null,
        phoneNumber: sessionUser.phoneNumber ?? null,
        createdAt: sessionUser.createdAt ?? null,
        lastLoginAt: sessionUser.lastLoginAt ?? null,
        mustChangePassword: sessionUser.mustChangePassword ?? null,
      }
    : undefined;

  // Toujours afficher le contenu : pas de retour null pendant le loading.
  return (
    <DashboardShell
      role="collaborateur"
      session={dashboardUser}
      status={status}
      navGroups={COLLABORATEUR_NAV_GROUPS}
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  );
}