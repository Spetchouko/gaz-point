"use client";
import { useEffect } from "react";
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/_components/spinner";

export default function DashboardClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = authClient.useSession();
  const router = useRouter();

  // Restaurer la session depuis les cookies avant de décider de l'affichage.
  // Pendant le statut "loading", on affiche un état de chargement sans rediriger,
  // ce qui élimine le clignotement de la page de connexion à l'actualisation (F5).
  useEffect(() => {
    if (status === "loading") {
      // Session encore en cours de restauration : on attend, on ne redirige pas.
      return;
    }
    if (status === "unauthenticated" || !session?.user) {
      // Session réellement expirée ou invalide : rediriger vers la connexion.
      router.push("/connexion");
    }
    // Si status === "authenticated" : rien à faire, le dashboard s'affiche.
  }, [status, session, router]);

  // Pendant la restauration de la session, afficher un loader au lieu de
  // retourner null (écran blanc) ou de rediriger prématurément.
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
