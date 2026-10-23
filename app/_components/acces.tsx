"use client"

import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  Store,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"

const userBenefits = [
  "Recherche illimitée de bouteilles de gaz",
  "Visualisation des points avec distance exacte",
  "Disponibilités et stocks vérifiés en temps réel",
  "Appel direct au vendeur et itinéraire GPS",
  "Accès instantané avec validation par téléphone",
]

const vendorBenefits = [
  "Visibilité prioritaire auprès de milliers d'acheteurs",
  "Mise à jour instantanée de vos stocks (marques/formats)",
  "Fiche dépôt vérifiée avec badge officiel et contact direct",
  "Statistiques de vues et d'appels générés",
  "Support dédié et gestion simplifiée des réservations",
]

export function Acces() {
  return (
    <section className="w-full bg-sky py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            <Sparkles className="size-3.5" />
            Nos profils d&apos;abonnement
          </Badge>

          <h2 className="mt-6 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une formule adaptée à vos besoins.
          </h2>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Que vous soyez un particulier en quête de gaz ou un responsable de
            dépôt voulant booster ses ventes.
          </p>
        </div>

        {/* 2 Profils de cartes : Usager & Vendeur */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {/* Profil 1 : Usager / Client */}
          <Card className="h-full border-0 bg-white shadow-sm transition-all hover:shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-mint text-primary-strong">
                  <User className="size-5" />
                </span>
                <Badge
                  variant="outline"
                  className="font-semibold"
                >
                  Particulier
                </Badge>
              </div>

              <CardTitle className="mt-3 font-heading text-xl font-bold">
                Usager / Client
              </CardTitle>
              <CardDescription>
                Pour les ménages et personnes cherchant du gaz au quotidien.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">
                  0 FCFA
                </span>
                <span className="text-xs text-muted-foreground">
                  / à vie (100% gratuit)
                </span>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-foreground">
                Inclus dans votre compte :
              </p>
              <ul className="mt-3 space-y-2.5">
                {userBenefits.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="border-t border-border">
              <Link href="/inscription">
                <Button
                  size="lg"
                  className="h-11 w-full gap-2 text-sm font-semibold cursor-pointer"
                >
                  Créer un compte Usager
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Profil 2 : Vendeur / Responsable dépôt */}
          <div className="relative h-full">
            {/* Top Tag (hors du Card pour ne pas être coupé par overflow-hidden) */}
            <div className="absolute -top-3.5 right-5 z-10 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm ring-1 ring-white">
              <Crown className="size-3" />
              Professionnel
            </div>

            <Card className="h-full overflow-visible border border-primary bg-white px-6 py-6 shadow-sm transition-all hover:shadow-sm sm:px-7 sm:py-7">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <Store className="size-5" />
                </span>
                <Badge className="font-semibold bg-primary text-primary-foreground">
                  Dépôt & Revendeur
                </Badge>
              </div>

              <div className="mt-3">
                <h3 className="font-heading text-xl font-bold text-foreground">
                  Vendeur / Dépôt de Gaz
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pour les gérants de points de vente et stations-service.
                </p>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-primary">
                  5 000 FCFA
                </span>
                <span className="text-xs text-muted-foreground">
                  / mois (sans engagement)
                </span>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-foreground">
                Avantages exclusifs :
              </p>
              <ul className="mt-3 space-y-2.5">
                {vendorBenefits.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/inscription">
                <Button
                  size="lg"
                  className="mt-6 h-11 w-full gap-2 text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong cursor-pointer"
                >
                  Créer un compte Vendeur
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
