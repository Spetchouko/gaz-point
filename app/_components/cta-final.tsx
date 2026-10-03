import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaFinal() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground md:px-12 md:py-16">
          <p className="text-balance text-sm font-medium text-primary-foreground/70 sm:text-base">
            Ton gaz est fini&nbsp;?
          </p>
          <p className="mt-1 text-balance text-sm font-medium text-primary-foreground/70 sm:text-base">
            Ne pars pas chercher au hasard.
          </p>

          <ArrowDown
            className="mx-auto mt-6 size-5 text-primary-foreground/40"
            aria-hidden
          />

          <h2 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Vérifie d&apos;abord où il y en a.
          </h2>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Button
              render={<Link href="/#trouver-du-gaz" />}
              nativeButton={false}
              size="lg"
              className="h-12 w-full gap-2 bg-primary-foreground px-6 text-base text-primary hover:bg-primary-foreground/90 sm:w-auto"
            >
              Trouver mon gaz
              <ArrowRight className="size-4" />
            </Button>

            <Button
              render={<Link href="/inscription" />}
              nativeButton={false}
              variant="ghost"
              size="lg"
              className="h-12 w-full gap-2 border border-primary-foreground/25 px-6 text-base text-primary-foreground hover:border-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
            >
              Créer mon compte
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