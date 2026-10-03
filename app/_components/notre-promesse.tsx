import { Ban, Eye, MapPin, PiggyBank } from "lucide-react"

const engagements = [
  {
    icon: PiggyBank,
    title: "Gratuit, vraiment",
    description:
      "0 FCFA, sans abonnement et sans carte bancaire. Le service ne se finance pas avec tes données.",
  },
  {
    icon: Eye,
    title: "Transparent sur l’information",
    description:
      "Un statut, une date et une source pour chaque point. Rien n’est affiché sans l’heure de la dernière mise à jour.",
  },
  {
    icon: MapPin,
    title: "Ancré dans les quartiers",
    description:
      "Nous commençons là où le problème est quotidien, à Douala, et nous élargissons avec les points de vente qui nous rejoignent.",
  },
  {
    icon: Ban,
    title: "Aucune promesse en trop",
    description:
      "Nous ne garantissons pas qu’une bouteille restera disponible jusqu’à ton arrivée. Nous montrons ce qui a été signalé, et quand.",
  },
]

export function NotrePromesse() {
  return (
    <section className="w-full border-y bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Nos engagements
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Quatre règles qu’on ne{" "}
            <span className="text-primary">negocie pas</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Elles sont la raison d’être du service. Si GazPoint cesse de les
            respecter, il ne sert plus à rien.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {engagements.map((engagement) => (
            <li
              key={engagement.title}
              className="flex flex-col rounded-xl border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <engagement.icon className="size-5" aria-hidden />
              </span>

              <h3 className="mt-5 text-pretty font-semibold text-foreground">
                {engagement.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {engagement.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}