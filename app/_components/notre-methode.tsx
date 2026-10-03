import { Ban, Building2, Clock, MessageCircleQuestion, Store } from "lucide-react"

const sources = [
  {
    icon: Store,
    title: "Les points de vente",
    description:
      "Ils signalent leur stock au fil de la journée, depuis leur espace professionnel.",
  },
  {
    icon: Building2,
    title: "L’administration",
    description:
      "Elle tient à jour les fiches officielles : adresse, formats vendus, horaires.",
  },
  {
    icon: Clock,
    title: "La date de mise à jour",
    description:
      "Chaque information est datée. Quand elle est ancienne, elle est marquée « à confirmer » au lieu d’être présentée comme fiable.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Les signalements des habitants",
    description:
      "Tu peux signaler un point qui n’existe plus ou une information fausse. Ça nous aide à corriger la carte.",
  },
]

export function NotreMethode() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Notre méthode
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            D’où vient l’information que tu vois
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Une disponibilité affichée sans origine ni date ne vaut rien. Voici les
            seules sources que nous utilisons.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          <ul className="space-y-5">
            {sources.map((source) => (
              <li key={source.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <source.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <h3 className="font-medium text-foreground">{source.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {source.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Ce que GazPoint ne fait pas
            </h3>

            <ul className="mt-5 space-y-3">
              {[
                "Il ne vend ni gaz, ni bouteille, ni matériel.",
                "Il n’achète pas le silence sur un point de vente.",
                "Il ne remplace pas l’appel au vendeur quand l’information est ancienne.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Ban
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                  />
                  <span className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 border-t pt-5 text-pretty text-sm font-medium text-foreground">
              Une information honnête vaut mieux qu&apos;une information
              rassurante.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}