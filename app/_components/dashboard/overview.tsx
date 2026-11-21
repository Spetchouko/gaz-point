"use client";

import Link from "next/link";
import { Search, Calendar, Package } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSafeSession } from "@/lib/auth-session";

export function DashboardOverview() {
  const { data: session, isPending } = useSafeSession();
  const user = session?.user;
  const isLoading = isPending;

  // Determine the welcome message based on available user data
  let welcomeHeading: React.ReactNode;
  let subtitle: React.ReactNode | null = null;

  if (isLoading) {
    // Afficher un état de chargement discret pendant le premier rendu
    welcomeHeading = (
      <span className="text-muted-foreground animate-pulse">
        Chargement du profil…
      </span>
    );
  } else if (user?.name) {
    // Nom disponible : extraire le prénom ou utiliser le nom complet
    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    if (firstName && lastName) {
      // Prénom et nom complets disponibles → montrer le prénom
      welcomeHeading = (
        <>
          Bienvenue{" "}
          <span className="text-primary font-semibold">
            {firstName}
          </span>{" "}
          dans votre espace client GazPoints !
        </>
      );
    } else if (firstName) {
      // Seul le prénom disponible
      welcomeHeading = (
        <>
          Bienvenue{" "}
          <span className="text-primary font-semibold">
            {firstName}
          </span>{" "}
          dans votre espace client GazPoints !
        </>
      );
    } else {
      // Seul le nom complet (pas de prénom séparé) disponible
      welcomeHeading = (
        <>
          Bienvenue{" "}
          <span className="text-primary font-semibold">
            {user.name}
          </span>{" "}
          dans votre espace client GazPoints !
        </>
      );
    }
  } else {
    // Profil incomplete : utilisateur connecté mais informations manquantes
    // Ne jamais afficher "Utilisateur" lorsque les informations du compte sont disponibles
    welcomeHeading = (
      <>
        Bienvenue dans votre espace client GazPoints !
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {welcomeHeading}
          </h1>
          {isLoading && (
            <p className="mt-1 text-xs text-muted-foreground">
              Récupération de vos informations en cours…
            </p>
          )}
          {!isLoading &&
            user?.name &&
            (
              <p className="mt-1 text-sm text-muted-foreground">
                Gérez vos recherches, vos réservations et consultez votre
                historique.
              </p>
            )}
          {!isLoading &&
            !user?.name &&
            (
              <p className="mt-1 text-sm text-muted-foreground">
                Vos informations de profil sont en cours de mise à jour.
              </p>
            )}
        </div>
      </div>

      {/* Accès rapide */}
      <section aria-labelledby="acces-rapide-heading">
        <h2 id="acces-rapide-heading" className="sr-only">Accès rapide</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard/recherches" className="group">
            <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors">
                    <Search className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary active:text-primary transition-colors">
                      Rechercher du gaz
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trouver des bouteilles disponibles près de chez vous
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/reservations" className="group">
            <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors">
                    <Calendar className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary active:text-primary transition-colors">
                      Mes réservations
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suivre vos réservations en cours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/historique" className="group">
            <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground active:bg-primary active:text-primary-foreground transition-colors">
                    <Package className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary active:text-primary transition-colors">
                      Mon historique
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consulter vos recherches et achats
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
