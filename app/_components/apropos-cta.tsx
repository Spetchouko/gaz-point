import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function AproposCta() {
  return (
    <section className="w-full py-16 md:py-24 bg-linear-to-b from-muted/30 via-muted/60 to-muted/30 border-y">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground md:px-12 md:py-16">
          <p className="text-balance text-sm font-medium text-primary-foreground/70 sm:text-base">
            Tu connais maintenant le projet.
          </p>

          <Badge
            variant="secondary"
            className="mt-3 h-6 bg-primary-foreground/15 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground"
          >
            Ne pars pas chercher au hasard
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Vérifie d'abord où il y en a.
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-pretty text-base text-primary-foreground/80">
            Choisis ta bouteille, regarde les points autour de toi, et pars une seule
            fois vers le bon endroit.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Button
              render={<Link href="/#trouver-du-gaz" />}
              nativeButton={false}
              size="lg"
              className="h-12 w-full gap-2 bg-primary-foreground px-6 text-base text-primary hover:bg-primary-foreground/90 sm:w-auto cursor-pointer"
            >
              <Search className="size-4" />
              Trouver mon gaz
              <ArrowRight className="size-4" />
            </Button>

            <Button
              render={<Link href="/#faq" />}
              nativeButton={false}
              variant="ghost"
              size="lg"
              className="h-12 w-full gap-2 border border-primary-foreground/25 px-6 text-base text-primary-foreground hover:border-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
            >
              Voir les questions fréquentes
            </Button>
          </div>

          <p className="mt-6 text-xs text-primary-foreground/60">
            Gratuit · Sans abonnement · Sans carte bancaire
          </p>
        </div>
      </div>
    </section>
  )
}