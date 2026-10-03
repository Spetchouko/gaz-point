const steps = [
  "Ton gaz est terminé.",
  "Il faut trouver une bouteille.",
  "Tu prends le transport.",
  "Tu vas à un point de vente.",
  "Le gaz n'est pas disponible.",
  "Tu dois continuer ailleurs.",
  "La facture de transport augmente.",
  "Du temps est perdu.",
]

export function Probleme() {
  return (
    <section className="w-full border-y bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Situation courante
            </p>

            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Le problème, ce n&apos;est pas seulement de trouver le gaz.
            </h2>

            <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
              Le vrai problème, c&apos;est de savoir où il y en a{" "}
              <span className="font-semibold text-foreground">
                avant
              </span>{" "}
              de prendre le transport.
            </p>
          </div>

          <ol className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-xl bg-background/70 p-4"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-foreground sm:text-base">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-center text-pretty text-base text-muted-foreground sm:text-lg">
            Tu n&apos;es pas seul. Beaucoup vivent la même situation chaque mois.
          </p>
        </div>
      </div>
    </section>
  )
}