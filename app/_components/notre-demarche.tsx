import { Megaphone, Navigation, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const constats = [
  {
    icon: Megaphone,
    title: "L'information existe, mais elle est dispersée",
    description:
      "Elle circule de bouche à oreille, dans un groupe de discussion, ou uniquement chez le vendeur. Celui qui n'a pas le numéro ne la trouve pas.",
  },
  {
    icon: Navigation,
    title: "Le déplacement se paie deux fois",
    description:
      "Une fois pour partir, une fois pour recommencer ailleurs parce que le premier point n'avait rien.",
  },
  {
    icon: Wallet,
    title: "Quand l'information manque, elle arrive trop tard",
    description:
      "On découvre l'état du stock en arrivant. Le transport est déjà dépensé, et la matinée avec.",
  },
]

export function NotreDemarche() {
  return (
    <section className="w-full py-16 md:py-24 bg-linear-to-b from-muted/30 via-muted/60 to-muted/30 border-y">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Notre point de départ
          </Badge>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une question très simple, une réponse très coûteuse.
          </h2>

          <div className="mt-5 space-y-4 text-pretty text-base text-muted-foreground sm:text-lg">
            <p>
              Pourquoi, à Douala, une partie des ménages dépense-t-elle autant
              d&apos;argent et de temps pour une seule bouteille de gaz ?
            </p>
            <p>
              La réponse tient en une phrase :{" "}
              <span className="font-semibold text-foreground">
                personne ne sait, avant de partir, où il reste du gaz.
              </span>{" "}
              Alors on prend la bouteille, on prend le transport, et on apprend la
              réponse en arrivant.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {constats.map((constat) => (
            <Card
              key={constat.title}
              className="transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-sm"
            >
              <CardHeader>
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <constat.icon className="size-5" aria-hidden />
                </span>
                <CardTitle className="mt-4 text-base font-semibold">
                  {constat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {constat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mx-auto mt-12 max-w-4xl border-0 bg-muted/60 p-6 shadow-none sm:p-8">
          <p className="text-pretty text-base leading-relaxed text-foreground sm:text-lg text-center">
            GazPoints est né de ce constat : ce n&apos;est pas le gaz qui manque,
            c&apos;est l&apos;information. Le gaz, lui, est déjà là, à quelques
            kilomètres.
          </p>
        </Card>
      </div>
    </section>
  )
}
