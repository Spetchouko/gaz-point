import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RechercheGaz } from "@/app/_components/recherche-gaz"

const benefits = [
  "Vérifie la dispo avant de partir",
  "Trouve un point de vente proche",
  "Évite les déplacements inutiles",
]

export function Hero() {
  return (
    <section id="accueil" className="w-full overflow-hidden bg-gradient-section">
      <div className="container mx-auto px-4 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Avant de te déplacer, vérifie d&apos;abord
          </Badge>

          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Ton gaz est fini&nbsp;?{" "}
            <span className="text-primary">
              Vérifie où il y en a avant de te déplacer.
            </span>
          </h1>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            GazPoints te montre les points de vente de gaz près de chez toi, avec la
            disponibilité, la distance et le numéro du vendeur.
          </p>
        </div>

        {/* Recherche — au premier plan, visible immédiatement */}
        <div
          id="trouver-du-gaz"
          className="mx-auto mt-10 max-w-3xl scroll-mt-24"
        >
          <RechercheGaz />

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 text-sm cursor-pointer"
              render={<Link href="/#comment-ca-marche" />}
              nativeButton={false}
            >
              Comment ça marche
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Preuves rapides */}
        <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3 sm:gap-6">
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
      </div>
    </section>
  )
}
