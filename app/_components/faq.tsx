"use client"

import { ArrowRight, MessageCircleQuestion } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTrouverGaz } from "@/lib/use-trouver-gaz"

const questions = [
  {
    question: "Quels sont les deux types de profils sur GazPoints ?",
    answer:
      "GazPoints propose deux profils : 1) Le profil « Usager / Client » (100% gratuit à vie) pour rechercher et localiser du gaz autour de soi ; 2) Le profil « Vendeur / Responsable dépôt » (5 000 FCFA/mois) pour référencer son point de vente, publier ses stocks en temps réel et recevoir les appels des clients.",
  },
  {
    question: "Comment fonctionne l'abonnement Vendeur à 5 000 FCFA ?",
    answer:
      "L'abonnement Vendeur est mensuel et sans engagement. Il permet à un gérant de dépôt ou revendeur d'obtenir un badge certifié, de mettre à jour ses stocks de bouteilles à tout moment et d'apparaître en priorité dans les résultats de recherche des usagers.",
  },
  {
    question: "Pourquoi dois-je renseigner et vérifier mon numéro de téléphone ?",
    answer:
      "Le numéro de téléphone mobile sert à sécuriser votre compte, vérifier votre identité et faciliter la mise en relation directe (par appel ou WhatsApp) entre usagers et vendeurs.",
  },
  {
    question: "GazPoints est-il vraiment gratuit pour les usagers ?",
    answer:
      "Oui. Pour tous les particuliers et ménages, l'accès est à 0 FCFA, sans abonnement, sans carte bancaire et sans frais cachés.",
  },
  {
    question: "Comment savoir si le gaz est réellement disponible chez un vendeur ?",
    answer:
      "Chaque point affiche un statut (En stock / À confirmer) et l'heure précise de sa dernière mise à jour par le vendeur. Vous pouvez également l'appeler directement en un clic avant de vous déplacer.",
  },
  {
    question: "Comment inscrire mon point de vente de gaz ?",
    answer:
      "Cliquez sur « Créer mon compte », sélectionnez le profil « Vendeur / Dépôt de gaz », renseignez vos informations et votre numéro de téléphone pour activer votre espace professionnel.",
  },
  {
    question: "GazPoints vend-il ou livre-t-il directement le gaz ?",
    answer:
      "Non. GazPoints est une plateforme de mise en relation et de géolocalisation. Nous vous indiquons où trouver du gaz et vous mettons en contact avec les vendeurs de votre quartier.",
  },
]

export function Faq() {
  const handleAction = useTrouverGaz()

  return (
    <section
      id="faq"
      className="w-full scroll-mt-16 bg-mint py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            Questions fréquentes
          </Badge>

          <h2 className="mt-6 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Tu as une question&nbsp;?
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground">
            Tout comprendre sur les profils Usagers, Vendeurs et le
            fonctionnement de la plateforme.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 lg:grid-cols-3">
          <Accordion className="rounded-2xl border border-border bg-card px-5 shadow-sm lg:col-span-2 md:px-6">
            {questions.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="py-4 text-base font-medium text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Card className="h-full border-0 bg-mint shadow-sm">
            <CardHeader>
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageCircleQuestion className="size-5" />
              </span>
              <CardTitle className="font-heading text-lg text-foreground">
                Prêt à commencer&nbsp;?
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Créez votre compte en quelques secondes et vérifiez votre numéro
                de téléphone pour accéder à GazPoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                className="h-11 w-full gap-2 cursor-pointer bg-primary font-semibold text-primary-foreground hover:bg-primary-strong"
                onClick={handleAction}
              >
                Trouver du gaz
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
