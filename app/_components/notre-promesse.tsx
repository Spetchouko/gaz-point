import { Ban, Eye, MapPin, PiggyBank } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const engagements = [
  {
    icon: PiggyBank,
    title: "Gratuit pour les usagers",
    description:
      "0 FCFA à vie, sans carte bancaire. Seul l'espace Vendeur est payant : 5 000 FCFA/mois, sans engagement. Les usagers ne paient jamais.",
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
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Nos engagements
          </Badge>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Quatre règles qu’on ne{" "}
            <span className="text-primary">négocie pas</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Elles sont la raison d’être du service. Si GazPoint cesse de les
            respecter, il ne sert plus à rien.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {engagements.map((engagement) => (
            <li key={engagement.title}>
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <engagement.icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle className="mt-4 text-base">
                    {engagement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {engagement.description}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
