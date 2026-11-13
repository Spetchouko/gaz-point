"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

export function DashboardOverview() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name ? user.name.split(" ")[0] : "Client";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bienvenue {firstName} à votre espace client GazPoints !
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos recherches, vos réservations et consultez votre historique.
          </p>
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
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green group-hover:bg-green group-hover:text-green-foreground active:bg-green active:text-green-foreground transition-colors">
                    <Calendar className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-green active:text-green transition-colors">
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
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green group-hover:bg-green group-hover:text-green-foreground active:bg-green active:text-green-foreground transition-colors">
                    <Package className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-green active:text-green transition-colors">
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
