"use client"

import { ArrowRight, Cylinder, ListChecks, MapPinned, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  const handleAction = () => {
    const el = document.getElementById("trouver-du-gaz")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="comment-ca-marche" className="w-full scroll-mt-16 py-16 md:py-24 bg-gradient-section">
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

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="size-5" />
                    </span>
                    <Badge variant="outline" className="font-medium uppercase tracking-wider text-muted-foreground">
                      Étape {index + 1}
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
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="h-12 w-full gap-2 px-6 text-base sm:w-auto cursor-pointer"
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