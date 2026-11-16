import Link from "next/link"
import { MessageCircleQuestion } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function ContactFaq() {
  return (
    <section className="w-full pb-16 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageCircleQuestion className="size-6" aria-hidden />
          </span>

          <Badge
            variant="secondary"
            className="mt-5 h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Questions fréquentes
          </Badge>

          <h2 className="mt-4 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Peut-être que la réponse est déjà là
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground">
            La gratuité pour les usagers, l’abonnement Vendeur, la fiabilité des
            informations, la localisation, la vie privée : les questions les plus
            fréquentes sont déjà traitées.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              render={<Link href="/#faq" />}
              nativeButton={false}
              size="lg"
              className="h-12 w-full px-6 text-base sm:w-auto"
            >
              Voir la FAQ
            </Button>

            <Button
              render={<Link href="/a-propos" />}
              nativeButton={false}
              variant="outline"
              size="lg"
              className="h-12 w-full px-6 text-base sm:w-auto"
            >
              Découvrir GazPoints
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}