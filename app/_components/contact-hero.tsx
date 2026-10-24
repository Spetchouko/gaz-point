import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const points = [
  "Réponse sous 48 h ouvrées",
  "Aucun compte requis",
  "Signalements traités dans les meilleurs délais",
]

export function ContactHero() {
  return (
    <section className="w-full border-t border-border bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Contact
          </Badge>

          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une question, une erreur, une idée ?{" "}
            <span className="text-primary">Écris-nous directement.</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Un formulaire, un email ou un appel : choisis le canal qui te convient.
            Aucun compte à créer pour nous écrire.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
