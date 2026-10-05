import {
  Compass,
  MapPinOff,
  PackageCheck,
  PiggyBank,
  Store,
  Timer,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    <section className="w-full py-16 md:py-24 bg-gradient-section-reverse">
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
            GazPoint ne te vend pas juste une information : il t&apos;aide à choisir
            où aller, avant de te déplacer.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <li key={benefit.title}>
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <benefit.icon className="size-5" />
                  </span>
                  <CardTitle className="text-lg font-semibold">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}