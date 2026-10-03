import Link from "next/link"
import {
  ArrowRight,
  Check,
  Megaphone,
  Store,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const included = [
  "Rechercher du gaz autant de fois que tu veux",
  "Tous les points de vente, avec leur distance",
  "La dernière mise à jour de chaque point",
  "Appeler le vendeur ou ouvrir l'itinéraire",
]

const accountSteps = [
  "Tu entres ton prénom et ton numéro.",
  "Tu vérifies ton numéro, une seule fois.",
  "Tu lances ta première recherche.",
]

const funding = [
  {
    icon: Store,
    title: "Des services pour les vendeurs",
    description: "Un espace professionnel pour les points de vente.",
  },
  {
    icon: Megaphone,
    title: "De la publicité",
    description: "Des espaces réservés, qui ne dérangent pas ta recherche.",
  },
]

export function Acces() {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Accès
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Pour toi, c&apos;est{" "}
            <span className="text-primary">gratuit</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Créer ton compte ne veut pas dire payer un abonnement. Pas de formule,
            pas de carte bancaire, pas de frais qui apparaissent plus tard.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-5 lg:gap-6">
          <div className="rounded-2xl border bg-card p-6 lg:col-span-3 md:p-8">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                0 FCFA
              </span>
              <span className="text-sm text-muted-foreground">
                pour toujours, pas par mois
              </span>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <Button
              render={<Link href="/#creer-compte" />}
              nativeButton={false}
              size="lg"
              className="mt-8 h-12 w-full gap-2 px-6 text-base sm:w-auto"
            >
              Créer mon compte
              <ArrowRight className="size-4" />
            </Button>

            <p className="mt-4 text-xs text-muted-foreground">
              Aucune carte bancaire demandée.
            </p>
          </div>

          <div
            id="creer-compte"
            className="scroll-mt-16 rounded-2xl border bg-muted/50 p-6 lg:col-span-2 md:p-8"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-4" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Créer ton compte
              </h3>
            </div>

            <ol className="mt-6 space-y-4">
              {accountSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground">{step}</span>
                </li>
              ))}
            </ol>

            <p className="mt-6 text-sm text-muted-foreground">
              Ton compte sert uniquement à utiliser GazPoint. Rien de plus.
            </p>
          </div>
        </div>

        <div className="mt-16 border-t pt-10">
          <h3 className="text-sm font-medium text-foreground">
            Et comment GazPoint est financé&nbsp;?
          </h3>

          <ul className="mt-5 grid gap-6 sm:grid-cols-2">
            {funding.map((item) => (
              <li key={item.title} className="flex gap-3">
                <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-muted-foreground">
            Aucun de ces moyens ne change le fait que ton accès, lui, est gratuit.
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            Tu es point de vente, ou tu veux en savoir plus sur le projet ?{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              Écris-nous
            </Link>{" "}
            ou passe par{" "}
            <Link
              href="/a-propos"
              className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              la page À propos
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}