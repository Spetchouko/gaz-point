import Link from "next/link"
import { ArrowRight, Cylinder, ListChecks, MapPinned, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  {
    icon: Cylinder,
    title: "Choisis ta bouteille",
    description: "Marque, format et quantité",
  },
  {
    icon: MapPinned,
    title: "Regarde où elle est disponible",
    description: "Les points de vente autour de toi",
  },
  {
    icon: ListChecks,
    title: "Choisis le point qui te convient",
    description: "Distance, horaires et contact",
  },
  {
    icon: Navigation,
    title: "Déplace-toi en sachant où tu vas",
    description: "Un seul trajet, au bon endroit",
  },
]

export function Solution() {
  return (
    <section id="comment-ca-marche" className="w-full scroll-mt-16 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            La solution
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Vérifie où trouver ton gaz{" "}
            <span className="text-primary">avant de te déplacer</span>
          </h2>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col rounded-xl border bg-card p-6 transition-colors hover:border-foreground/20"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Étape {index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-pretty font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <Button
            render={<Link href="/#trouver-du-gaz" />}
            nativeButton={false}
            size="lg"
            className="h-12 w-full gap-2 px-6 text-base sm:w-auto"
          >
            Trouver du gaz
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}