"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell";
import { COLLABORATEUR_NAV_GROUPS } from "@/app/_components/dashboard/dashboard-nav";
import { useDashboardSession, useAutoRefreshSession } from "@/lib/auth-session";
import type { DashboardUser } from "@/lib/auth-session";

export default function DashboardCollaborateurLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, isAuthenticated, isLoading } =
    useDashboardSession();
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

  const sessionUser: DashboardUser | undefined = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
        role: user.role ?? null,
        emailVerified: user.emailVerified,
        isActive: user.isActive ?? null,
        phoneNumber: user.phoneNumber ?? null,
        createdAt: user.createdAt ?? null,
        lastLoginAt: user.lastLoginAt ?? null,
        mustChangePassword: user.mustChangePassword ?? null,
      }
    : undefined;

  // Toujours afficher le contenu : pas de retour null pendant le loading.
  return (
    <DashboardShell
      role="collaborateur"
      session={sessionUser}
      status={status}
      navGroups={COLLABORATEUR_NAV_GROUPS}
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  );
}