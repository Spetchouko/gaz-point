import { Badge } from "@/components/ui/badge"
import { RechercheGaz } from "@/app/_components/recherche-gaz"

/**
 * Section de recherche affichée dans le dashboard client.
 * Le bloc formulaire / résultats / réservation vit dans RechercheGaz,
 * partagé avec la page d'accueil.
 */
export function TrouverMonGaz() {
  return (
    <section aria-label="Rechercher du gaz">
      <div className="mx-auto max-w-3xl text-center">
        <Badge
          variant="secondary"
          className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
        >
          Trouver mon gaz
        </Badge>

        <h2 className="mt-6 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Tu cherches le gaz où&nbsp;?
        </h2>

        <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
          Renseigne ta bouteille et ta zone pour trouver les points de vente
          disponibles en direct.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <RechercheGaz />
      </div>
    </section>
  )
}
