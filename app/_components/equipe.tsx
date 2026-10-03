import Link from "next/link"
import { Mail } from "lucide-react"

const equipe = [
  {
    role: "Fondation et direction",
    name: "[NOM ET PRÉNOM]",
    description:
      "A lancé GazPoint après avoir constaté le problème sur le terrain, quartier par quartier.",
  },
  {
    role: "Produit et développement",
    name: "[NOM ET PRÉNOM]",
    description:
      "Construit le service de recherche, la carte des points de vente et les espaces vendeurs.",
  },
  {
    role: "Relation points de vente",
    name: "[NOM ET PRÉNOM]",
    description:
      "Accompagne les revendeurs qui rejoignent la plateforme et veille sur la fiabilité des informations.",
  },
]

export function Equipe() {
  return (
    <section className="w-full border-y bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            L’équipe
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une petite équipe,{" "}
            <span className="text-primary">un grand territoire</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            GazPoint est porté par une équipe locale, à Douala. Nous couvrons
            progressivement les quartiers où le service est le plus utile.
          </p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipe.map((membre) => (
            <li
              key={membre.role}
              className="flex flex-col rounded-xl border bg-card p-6"
            >
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              >
                {membre.name.charAt(1)}
              </span>

              <h3 className="mt-5 text-pretty font-semibold text-foreground">
                {membre.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {membre.role}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {membre.description}
              </p>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4 shrink-0" aria-hidden />
          Tu es point de vente et tu veux apparaître sur GazPoint ?{" "}
          <a
            href="mailto:[ADRESSE EMAIL DE CONTACT]"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Écris-nous
          </a>
          , ou passe par la{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            page de contact
          </Link>
          .
        </p>
      </div>
    </section>
  )
}