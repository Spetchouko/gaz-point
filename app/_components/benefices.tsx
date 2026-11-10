import {
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
    <section className="w-full bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
          {/* Contenu à gauche — centré et resserré */}
          <div className="lg:pl-8 xl:pl-14 space-y-4">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="h-5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                Ce que ça t&apos;apporte
              </Badge>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Avant de partir, <span className="text-primary">tu décides</span>
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                GazPoints ne te vend pas juste une information : il t&apos;aide à
                choisir où aller, avant de te déplacer.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <Card
                  key={benefit.title}
                  className="p-3 rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                >
                  <CardHeader>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-mint text-primary-strong ring-1 ring-primary/20">
                      <benefit.icon className="size-3.5" />
                    </span>
                    <CardTitle className="mt-2 text-sm font-bold">
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

          {/* Image à droite — pleine section avec aspect-ratio réservé */}
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/10 lg:sticky lg:top-20 aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9]">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-2xl"
              style={{
                backgroundImage: 'url("/brand/kill.png")',
              }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}