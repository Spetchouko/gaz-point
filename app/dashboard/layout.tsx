"use client";
import { useEffect } from "react";
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardSession, useAutoRefreshSession } from "@/lib/auth-session";

export default function DashboardClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, user, isAuthenticated, isLoading, role } =
    useDashboardSession();
  const router = useRouter();
  const pathname = usePathname();

  // Rafraîchir automatiquement la session au focus de la fenêtre
  // pour détecter les changements faits dans d'autres onglets
  useAutoRefreshSession()

  // Si la session est définitivement invalide (expiration en cours de navigation),
  // rediriger vers la connexion. Pendant le chargement (isLoading), on affiche
  // le contenu pour éviter tout clignotement : le middleware a déjà protégé
  // la route côté serveur, donc un utilisateur authentifié ne verra jamais
  // d'état déconnecté au premier rendu.
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated || !user) {
      router.push("/connexion");
      return;
    }
    // Si l'utilisateur est sur le dashboard générique (/dashboard) mais a un rôle
    // spécifique, le rediriger vers son dashboard dédié (gardé pour cohérence,
    // bien que le middleware traite déjà ce cas côté serveur).
    if (pathname === "/dashboard") {
      if (role === "admin" || role === "collaborateur") {
        router.push("/dashboard/admin");
      } else if (role === "vendor") {
        router.push("/dashboard/vendeur");
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname, role]);

  // Toujours afficher le contenu : pas de retour null pendant le loading,
  // ce qui supprimerait le clignotement et le retour à la page de connexion.
  return (
    <DashboardClientLayout session={user} status={status}>
      {children}
    </DashboardClientLayout>
  );
}
