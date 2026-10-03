import Link from "next/link"
import { ArrowRight, Check, Store } from "lucide-react"
import { Button } from "@/components/ui/button"

const avantages = [
  "Un espace professionnel pour signaler ton stock",
  "Tes horaires et tes formats visibles par les habitants du quartier",
  "Rien à payer : l’inscription est gratuite",
  "Tu arrêtes de répondre au téléphone pour demander si tu as du gaz",
]

export function ContactVendeurs() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl rounded-2xl border bg-card p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
            <div>
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="size-6" aria-hidden />
              </span>

              <h2 className="mt-6 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Tu vends du gaz et tu n&apos;apparais pas encore sur GazPoint ?
              </h2>

              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Écris-nous avec le nom de ton commerce et ton quartier. On active ta
                fiche et on te montre comment signaler ton stock depuis ton espace.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button
                  render={<Link href="/inscription" />}
                  nativeButton={false}
                  size="lg"
                  className="h-12 w-full gap-2 px-6 text-base sm:w-auto"
                >
                  Créer mon espace vendeur
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 p-6">
              <h3 className="font-semibold text-foreground">
                Ce que ça change pour toi
              </h3>

              <ul className="mt-5 space-y-3">
                {avantages.map((avantage) => (
                  <li key={avantage} className="flex gap-3">
                    <Check
                      aria-hidden
                      className="mt-1 size-4 shrink-0 text-primary"
                    />
                    <span className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {avantage}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}