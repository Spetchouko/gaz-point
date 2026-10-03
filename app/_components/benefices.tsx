import {
  Compass,
  MapPinOff,
  PackageCheck,
  PiggyBank,
  Store,
  Timer,
} from "lucide-react"

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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Ce que ça t&apos;apporte
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
            <li
              key={benefit.title}
              className="flex flex-col rounded-xl border bg-card p-6 transition-colors hover:border-foreground/20"
            >
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <benefit.icon className="size-5" />
              </span>

              <h3 className="mt-5 text-pretty font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}