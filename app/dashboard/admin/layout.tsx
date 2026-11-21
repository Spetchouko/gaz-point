"use client";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/app/_components/theme-provider";
import { DashboardAdminLayout } from "@/app/_components/dashboard/admin-layout-new";
import { useDashboardSession, useAutoRefreshSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

export default function DashboardAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, isAuthenticated, isLoading } =
    useDashboardSession();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  // Rafraîchir automatiquement la session au focus de la fenêtre
  useAutoRefreshSession()

  // Charger les permissions réelles depuis l'API protégée (collaborateur a des
  // permissions assignées, admin a tous les modules).
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
          setPermissions(new Set(Array.isArray(data.permissions) ? data.permissions : []));
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
      window.location.href = "/connexion-admin";
      return;
    }
  }, [isLoading, isAuthenticated, user]);

  // Toujours afficher le contenu : pas de retour null pendant le loading.
  return (
    <ThemeProvider>
      <DashboardAdminLayout session={user} status={status} permissions={permissions}>
        {children}
      </DashboardAdminLayout>
    </ThemeProvider>
  );
}
