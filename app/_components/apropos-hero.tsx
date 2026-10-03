import Image from "next/image"
import { Check } from "lucide-react"

const points = ["Gratuit, sans abonnement", "Sans carte bancaire", "Fait à Douala"]

export function AproposHero() {
  return (
    <section className="w-full border-b bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              À propos
            </p>

            <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              GazPoint veut supprimer{" "}
              <span className="text-primary">les déplacements à vide</span> pour
              chercher du gaz.
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Nous construisons un service d&apos;information sur les points de vente
              de gaz de cuisson. Pas une boutique, pas un revendeur : un moyen de
              savoir, avant de partir, où il reste du gaz.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
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

          <div className="mx-auto flex size-36 shrink-0 items-center justify-center rounded-3xl border bg-card p-8 lg:size-48">
            <Image
              src="/brand/logo.png"
              alt=""
              width={192}
              height={192}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}