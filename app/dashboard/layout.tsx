"use client";
import { useEffect, useRef } from "react";
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout";
import { DashboardShell } from "@/app/_components/dashboard/dashboard-shell";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardSession, useAutoRefreshSession } from "@/lib/auth-session";
import { isUnauthenticatedRequest, requestJson } from "@/lib/client-request";

function VendorRouteRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <DashboardShell role="vendor" status="loading">
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Redirection…
      </div>
    </DashboardShell>
  );
}

export default function DashboardClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, isAuthenticated, isLoading } =
    useDashboardSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingToLoginRef = useRef(false);

  // Rafraîchir automatiquement la session au focus de la fenêtre
  // pour détecter les changements faits dans d'autres onglets
  useAutoRefreshSession()

  // La session client peut rester temporairement indisponible pendant un
  // rafraîchissement. La redirection vers la connexion n'est donc déclenchée
  // qu'après une confirmation serveur explicite (HTTP 401).
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      redirectingToLoginRef.current = false;
      return;
    }
    if (redirectingToLoginRef.current) return;

    const controller = new AbortController();
    let cancelled = false;

    async function confirmInvalidSession() {
      try {
        await requestJson(
          "/api/user/me",
          {
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          }
        );
      } catch (error) {
        if (cancelled || !isUnauthenticatedRequest(error)) return;
        if (redirectingToLoginRef.current) return;
        redirectingToLoginRef.current = true;
        const currentPath =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : pathname;
        router.replace(
          `/connexion?redirect=${encodeURIComponent(currentPath)}`
        );
      }
    }

    void confirmInvalidSession();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isLoading, isAuthenticated, pathname, router]);

  // Les espaces admin, vendeur et collaborateur ont leur propre coquille
  // (sidebar + en-tête + footer) dans leur layout dédié. La coquille générique
  // du dashboard ne doit pas être rendue sur ces routes, sinon deux coquilles
  // et deux footers s'affichent en même temps.
  const hasDedicatedShell =
    pathname.startsWith("/dashboard/admin") ||
    pathname.startsWith("/dashboard/vendeur") ||
    pathname.startsWith("/dashboard/collaborateur");

  if (hasDedicatedShell) {
    return <>{children}</>;
  }

  const isVendorUser = user?.role === "vendor";

  const usesVendorShell =
    pathname === "/dashboard/depot" ||
    pathname.startsWith("/dashboard/depot/") ||
    pathname === "/dashboard/reservations/vendor" ||
    pathname === "/dashboard/reservations/verify" ||
    (isVendorUser && pathname === "/dashboard/avis");

  if (usesVendorShell) {
    return (
      <DashboardShell role="vendor" session={user} status={status}>
        {children}
      </DashboardShell>
    );
  }

  // Redirige un vendeur connecté vers ses propres pages quand il atterrit
  // sur une route générique partagée avec les clients.
  if (isVendorUser) {
    const vendorRedirects: Record<string, string> = {
      "/dashboard/notifications": "/dashboard/vendeur/notifications",
      "/dashboard/historique": "/dashboard/vendeur/historique",
      "/dashboard/parametres": "/dashboard/vendeur/parametres",
      "/dashboard/profil": "/dashboard/vendeur/profil",
      "/dashboard/reservations": "/dashboard/depot/reservations",
      "/dashboard/recherches": "/dashboard/vendeur/resultats-recherche",
    };
    const redirectTo = vendorRedirects[pathname];
    if (redirectTo) {
      return <VendorRouteRedirect to={redirectTo} />;
    }
  }

  // Toujours afficher le contenu : pas de retour null pendant le loading,
  // ce qui supprimerait le clignotement et le retour à la page de connexion.
  return (
    <DashboardClientLayout session={user} status={status}>
      {children}
    </DashboardClientLayout>
  );
}
