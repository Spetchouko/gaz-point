"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell";
import { ADMIN_NAV_GROUPS } from "@/app/_components/dashboard/dashboard-nav";
import {
  DASHBOARD_PERMISSION_KEYS,
  useDashboardSession,
} from "@/lib/auth-session";
import type { DashboardUser, SessionUser } from "@/lib/auth-session";

interface AdminClientLayoutProps {
  sessionUser: SessionUser;
  children: React.ReactNode;
}

function AdminHeaderActions() {
  return (
    <span className="hidden whitespace-nowrap text-xs font-medium uppercase tracking-wider text-muted-foreground/70 xl:inline">
      Espace Administrateur
    </span>
  );
}

export function DashboardAdminClientLayout({
  sessionUser,
  children,
}: AdminClientLayoutProps) {
  const { status, user, isAuthenticated, isLoading } = useDashboardSession();
  const [apiPermissions, setApiPermissions] = useState<Set<string>>(
    () => new Set<string>()
  );
  const router = useRouter();

  // Charger les permissions réelles depuis l'API protégée (collaborateur a des
  // permissions assignées, admin a tous les modules). Les permissions admin sont
  // dérivées du rôle pour éviter un sidebar vide pendant l'aller-retour vers l'API.
  const permissions = useMemo(() => {
    if (sessionUser.role !== "admin") {
      return apiPermissions;
    }
    return new Set<string>([...DASHBOARD_PERMISSION_KEYS, ...apiPermissions]);
  }, [apiPermissions, sessionUser.role]);

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
          setApiPermissions(new Set(Array.isArray(data.permissions) ? data.permissions : []));
        } else if (!cancelled) {
          console.error(`[admin] permissions: HTTP ${res.status}`);
        }
      } catch (error) {
        // Modules masqués en secours, mais l'erreur reste visible en console.
        console.error("[admin] permissions:", error);
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

  return (
    <DashboardShell
      role="admin"
      session={dashboardUser}
      status={status}
      navGroups={ADMIN_NAV_GROUPS}
      permissions={permissions}
      headerActions={<AdminHeaderActions />}
    >
      {children}
    </DashboardShell>
  );
}