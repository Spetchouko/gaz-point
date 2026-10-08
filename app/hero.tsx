"use client"

import Link from "next/link"
import { ArrowRight, Check, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const benefits = [
  "Vérifie la dispo avant de partir",
  "Trouve un point de vente proche",
  "Évite les déplacements inutiles",
]

export function Hero() {
  const handleTrouverGaz = () => {
    const el = document.getElementById("trouver-du-gaz")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="accueil" className="w-full overflow-hidden py-16 md:py-24 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Avant de te déplacer, vérifie d&apos;abord
          </Badge>

          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Ton gaz est fini ?{" "}
            <span className="text-primary">
              Vérifie où il y en a avant de te déplacer.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            GazPoint te montre les points de vente de gaz près de chez toi, avec la
            disponibilité, la distance et le numéro du vendeur. Tu pars seulement
            quand c&apos;est sûr.
          </p>

          <ul className="mt-8 grid w-full gap-3 sm:grid-cols-3 sm:gap-6">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2 text-left text-sm text-muted-foreground"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              className="h-12 w-full gap-2 px-6 text-base sm:w-auto cursor-pointer"
              onClick={handleTrouverGaz}
            >
              <Search className="size-4" />
              Trouver du gaz
              <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link href="/#comment-ca-marche" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-12 w-full px-6 text-base sm:w-auto"
            >
              Comment ça marche
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}