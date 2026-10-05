import Link from "next/link"
import { ArrowRight, BadgeCheck, Check, Crown, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const avantages = [
  "Un espace professionnel pour publier tes stocks en temps réel",
  "Une fiche vérifiée avec badge certifié et contact direct",
  "Une place prioritaire dans les résultats de recherche",
  "Des statistiques de vues et d’appels générés",
]

export function ContactVendeurs() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-5xl overflow-visible border-2 border-primary bg-primary/5 p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <Store className="size-6" aria-hidden />
                </span>
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <Crown className="size-3" aria-hidden />
                  Professionnel
                </Badge>
              </div>

              <h2 className="mt-6 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Tu vends du gaz et tu n&apos;apparais pas encore sur GazPoint ?
              </h2>

              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Crée ton compte Vendeur, renseigne ton dépôt et ton numéro de
                téléphone : tu publies tes stocks en direct et tu reçois les
                appels des clients.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="h-7 gap-1.5 px-3 text-sm font-semibold"
                >
                  <BadgeCheck className="size-4" aria-hidden />
                  5 000 FCFA/mois
                </Badge>
                <span className="text-xs text-muted-foreground">
                  sans engagement · usagers : 0 FCFA à vie
                </span>
              </div>

              <Button
                render={<Link href="/inscription" />}
                nativeButton={false}
                size="lg"
                className="mt-8 h-12 w-full gap-2 px-6 text-base sm:w-auto"
              >
                Créer mon espace vendeur
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <Card className="h-full bg-background/80 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  Ce que ça change pour toi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
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

                <Separator className="my-4" />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Déjà inscrit ?{" "}
                  <Link
                    href="/connexion"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    Connecte-toi
                  </Link>{" "}
                  pour gérer ton espace.
                </p>
              </CardContent>
            </Card>
          </div>
        </Card>
      </div>
    </section>
  )
}
