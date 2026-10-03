import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  "Ton gaz finit le matin.",
  "Tu prends ta bouteille et tu verrouilles la porte.",
  "Tu descends chercher, en espérant que le premier point aura.",
  "Premier point : pas de gaz.",
  "Tu refais le trajet, et tu payes encore le transport.",
  "Deuxième point : toujours rien.",
]

export function Storytelling() {
  return (
    <section className="w-full border-y bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            La situation
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Le matin où ton gaz finit.
          </h2>

          <div className="relative mt-10">
            <span
              className="absolute left-[5px] top-3 bottom-3 w-px bg-border"
              aria-hidden
            />
            <ol className="space-y-4">
              {steps.map((step) => (
                <li key={step} className="flex gap-4">
                  <span className="mt-2.5 size-2.5 shrink-0 rounded-full border-2 border-foreground/25 bg-background" />
                  <p className="text-pretty text-lg leading-snug text-foreground sm:text-xl">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 rounded-xl border bg-muted/50 p-6">
            <p className="text-pretty text-lg leading-snug text-foreground sm:text-xl">
              Et au final, le transport est dépensé, la matinée est perdue, et tu
              n&apos;as toujours pas trouvé ce que tu cherchais.
            </p>
            <p className="mt-4 text-pretty text-lg font-semibold leading-snug text-foreground sm:text-xl">
              Le pire, c&apos;est que personne ne t&apos;avait prévenu.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center md:mt-20">
          <h3 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Et si tu pouvais vérifier{" "}
            <span className="text-primary">avant de partir</span> ?
          </h3>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            GazPoint te montre où il reste du gaz, à quelle distance, et si le point
            de vente a vraiment du stock. Tu pars une seule fois, vers le bon
            endroit.
          </p>

          <Button
            render={<Link href="/#trouver-du-gaz" />}
            nativeButton={false}
            size="lg"
            className="mt-8 h-12 w-full gap-2 px-6 text-base sm:w-auto"
          >
            Trouver mon gaz
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}