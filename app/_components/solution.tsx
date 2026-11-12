"use client"

import Link from "next/link"
import {
  ArrowRight,
  Cylinder,
  ListChecks,
  MapPinned,
  Navigation,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTrouverGaz } from "@/lib/use-trouver-gaz"

const steps = [
  {
    icon: Cylinder,
    title: "Choisis ta bouteille",
    description: "Marque, format et quantité",
  },
  {
    icon: MapPinned,
    title: "Regarde où elle est disponible",
    description: "Les points de vente autour de toi",
  },
  {
    icon: ListChecks,
    title: "Choisis le point qui te convient",
    description: "Distance, horaires et contact",
  },
  {
    icon: Navigation,
    title: "Déplace-toi en sachant où tu vas",
    description: "Un seul trajet, au bon endroit",
  },
]

export function Solution() {
  const handleAction = useTrouverGaz()

  return (
    <section
      id="comment-ca-marche"
      className="w-full scroll-mt-16 bg-mint py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image à gauche — pleine section avec aspect-ratio réservé */}
          <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl ring-4 ring-border/20 aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9]">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-3xl"
              style={{
                backgroundImage: 'url("/brand/jgtr.webp")',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Contenu à droite */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className="h-7 px-4 text-xs font-semibold uppercase tracking-[0.15em]"
              >
                La solution
              </Badge>

              <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Vérifie où trouver ton gaz{" "}
                <span className="text-primary">avant de te déplacer</span>
              </h2>

              <p className="text-lg text-muted-foreground sm:text-xl leading-relaxed">
                GazPoints te montre les points de vente de gaz près de chez toi,
                avec la disponibilité, la distance et le numéro du vendeur.
              </p>
            </div>

            {/* Étapes — 2 rangées de 2 */}
            <div className="grid sm:grid-cols-2 gap-3">
              {steps.map((step) => (
                <Card
                  key={step.title}
                  className="transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm p-0"
                >
                  <CardHeader className="p-3 pb-2">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border">
                      <step.icon className="size-4" />
                    </span>
                    <CardTitle className="mt-2 text-sm font-bold leading-snug">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <CardDescription className="text-xs leading-snug">{step.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              size="lg"
              className="h-12 w-full gap-2 px-8 text-base font-semibold shadow-sm sm:w-auto cursor-pointer"
              onClick={handleAction}
            >
              Trouver du gaz
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
