const sujets = [
  {
    objet: "Question générale",
    description:
      "Comprendre le service, savoir si GazPoint couvre ton quartier, ou demander une précision.",
  },
  {
    objet: "Signalement",
    description:
      "Un point de vente qui n’existe plus, une disponibilité fausse, une adresse erronée. On corrige la carte.",
  },
  {
    objet: "Problème technique",
    description:
      "Une page qui ne s’affiche pas, une recherche qui ne trouve rien, une erreur d’interface.",
  },
  {
    objet: "Données personnelles",
    description:
      "Accès, rectification ou suppression de tes données. Objet à utiliser en priorité.",
  },
  {
    objet: "Facturation",
    description:
      "Une demande de paiement, un remboursement ou une facture déjà réglée.",
  },
  {
    objet: "Partenariat ou presse",
    description:
      "Un article sur GazPoint, une interview, ou une collaboration institutionnelle.",
  },
]

export function ContactSujets() {
  return (
    <section className="w-full border-y bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Avant d’écrire
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Mets le bon objet dans ton message
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Ça nous permet de traiter ta demande plus vite. Un objet clair, c&apos;est
            une réponse en quelques heures au lieu de plusieurs jours.
          </p>

          <dl className="mt-10 overflow-hidden rounded-xl border bg-card">
            {sujets.map((sujet) => (
              <div
                key={sujet.objet}
                className="flex flex-col gap-1 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <dt className="text-sm font-medium text-foreground sm:w-52 sm:shrink-0">
                  {sujet.objet}
                </dt>
                <dd className="text-pretty text-sm text-muted-foreground">
                  {sujet.description}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 rounded-lg bg-muted/60 p-4 text-pretty text-sm leading-relaxed text-muted-foreground">
            Aucun de ces objets n&apos;est obligatoire. Si tu ne sais pas lequel
            choisir, écris simplement ce que tu veux savoir : on fera le tri.
          </p>
        </div>
      </div>
    </section>
  )
}