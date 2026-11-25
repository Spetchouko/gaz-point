"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell";
import { ADMIN_NAV_GROUPS } from "@/app/_components/dashboard/dashboard-nav";
import {
  DASHBOARD_PERMISSION_KEYS,
  useDashboardSession,
} from "@/lib/auth-session";
import type { DashboardUser } from "@/lib/auth-session";

function AdminHeaderActions() {
  return (
    <span className="hidden whitespace-nowrap text-xs font-medium uppercase tracking-wider text-muted-foreground/70 xl:inline">
      Espace Administrateur
    </span>
  );
}

export default function DashboardAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, isAuthenticated, isLoading } = useDashboardSession();
  const [apiPermissions, setApiPermissions] = useState<Set<string>>(
    () => new Set<string>()
  );
  const router = useRouter();

  // Charger les permissions réelles depuis l'API protégée (collaborateur a des
  // permissions assignées, admin a tous les modules). Les permissions admin sont
  // dérivées du rôle pour éviter un sidebar vide pendant l'aller-retour vers l'API.
  const permissions = useMemo(() => {
    if (user?.role !== "admin") {
      return apiPermissions;
    }
    return new Set<string>([...DASHBOARD_PERMISSION_KEYS, ...apiPermissions]);
  }, [apiPermissions, user?.role]);

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
  // pour éviter le clignotement : le proxy a déjà protégé la route côté serveur.
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

  return (
    <DashboardShell
      role="admin"
      session={sessionUser}
      status={status}
      navGroups={ADMIN_NAV_GROUPS}
      permissions={permissions}
      headerActions={<AdminHeaderActions />}
    >
      {children}
    </DashboardShell>
  );
}
