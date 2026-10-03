import { Megaphone, Navigation, Wallet } from "lucide-react"

const constats = [
  {
    icon: Megaphone,
    title: "L’information existe, mais elle est dispersée",
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
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Notre point de départ
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une question très simple, une réponse très coûteuse.
          </h2>

          <div className="mt-6 space-y-4">
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              Pourquoi, à Douala, une partie des ménages dépense-t-elle autant
              d&apos;argent et de temps pour une seule bouteille de gaz ?
            </p>
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              La réponse tient en une phrase :{" "}
              <span className="font-semibold text-foreground">
                personne ne sait, avant de partir, où il reste du gaz.
              </span>{" "}
              Alors on prend la bouteille, on prend le transport, et on apprend la
              réponse en arrivant.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {constats.map((constat) => (
              <li
                key={constat.title}
                className="flex flex-col rounded-xl border bg-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <constat.icon className="size-5" aria-hidden />
                </span>

                <h3 className="mt-5 text-pretty font-semibold text-foreground">
                  {constat.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {constat.description}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-xl border bg-muted/50 p-6">
            <p className="text-pretty text-base leading-relaxed text-foreground sm:text-lg">
              GazPoint est né de ce constat : ce n&apos;est pas le gaz qui manque,
              c&apos;est l&apos;information. Le gaz, lui, est déjà là, à quelques
              kilomètres.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}