"use client"

import { ArrowRight, Cylinder, Clock, ListChecks, MapPinned, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      className="w-full scroll-mt-16 border-y bg-linear-to-b from-muted/30 via-muted/60 to-muted/30 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            La solution
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Vérifie où trouver ton gaz{" "}
            <span className="text-primary">avant de te déplacer</span>
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <Card
              key={step.title}
              className="transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                    <step.icon className="size-5" />
                  </span>
                  <Badge variant="outline" className="gap-1 font-semibold text-muted-foreground">
                    <Clock className="size-3" />
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base font-semibold">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-xl text-center">
          <Button
            size="lg"
            className="h-12 w-full gap-2 px-8 text-base font-semibold shadow-md sm:w-auto cursor-pointer"
            onClick={handleAction}
          >
            Trouver du gaz
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}