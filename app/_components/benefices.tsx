import {
  Clock,
  Compass,
  MapPinOff,
  PackageCheck,
  PiggyBank,
  Store,
  Timer,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const benefits = [
  {
    icon: MapPinOff,
    title: "Moins de déplacements inutiles",
    description: "Tu ne fais plus le tour de plusieurs points de vente pour rien.",
  },
  {
    icon: PiggyBank,
    title: "Moins d'argent pour le transport",
    description: "Tu économises le taxi, la moto et l'essence.",
  },
  {
    icon: Timer,
    title: "Tu gagnes du temps",
    description: "Deux minutes de recherche au lieu d'une demi-journée.",
  },
  {
    icon: Compass,
    title: "Tu sais où chercher",
    description: "Tu vas droit au bon endroit, sans errer dans les quartiers.",
  },
  {
    icon: PackageCheck,
    title: "Tu connais la disponibilité",
    description: "Tu sais s'il reste du gaz avant de quitter la maison.",
  },
  {
    icon: Store,
    title: "Tu trouves plus facilement un point de vente",
    description: "Le bon commerce, près de chez toi.",
  },
]

export function Benefices() {
  return (
    <section className="w-full border-y bg-linear-to-b from-muted/30 via-muted/60 to-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Ce que ça t&apos;apporte
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Avant de partir,{" "}
            <span className="text-primary">tu décides</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            GazPoints ne te vend pas juste une information : il t&apos;aide à choisir
            où aller, avant de te déplacer.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {benefits.map((benefit, idx) => (
            <Card
              key={benefit.title}
              className="transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                    <benefit.icon className="size-5" />
                  </span>
                  <Badge variant="outline" className="gap-1 font-semibold text-muted-foreground">
                    <Clock className="size-3" />
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-base">
                  <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Étape {idx + 1}
                  </span>
                  <span className="mt-1 block font-bold text-foreground">
                    {benefit.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}