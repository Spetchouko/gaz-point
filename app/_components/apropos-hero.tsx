import Image from "next/image"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const points = [
  "Usager : 0 FCFA à vie",
  "Vendeur : 5 000 FCFA/mois, sans engagement",
  "Fait à Douala",
]

export function AproposHero() {
  return (
    <section className="w-full border-t border-border bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            À propos
          </Badge>

          <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            GazPoints veut supprimer{" "}
            <span className="text-primary">les déplacements à vide</span> pour
            chercher du gaz.
          </h1>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg max-w-3xl mx-auto">
            Nous construisons un service d&apos;information sur les points de vente
            de gaz de cuisson. Pas une boutique, pas un revendeur : un moyen de
            savoir, avant de partir, où il reste du gaz. Deux profils : les
            usagers y entrent gratuitement, les vendeurs y publient leurs
            stocks.
          </p>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 mx-auto">
          <Card className="mx-auto flex size-36 shrink-0 items-center justify-center border-none bg-background p-8 shadow-sm lg:size-48">
            <Image
              src="/brand/logo.png"
              alt=""
              width={192}
              height={192}
              className="h-full w-full object-contain"
            />
          </Card>
        </div>
      </div>
    </section>
  )
}
