import Link from "next/link"
import { ArrowRight, MessageCircleQuestion } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

const questions = [
  {
    question: "GazPoint est-il vraiment gratuit ?",
    answer:
      "Oui. 0 FCFA, sans abonnement et sans carte bancaire. Créer un compte ne t'engage à rien.",
  },
  {
    question: "Est-ce que GazPoint fonctionne à Douala ?",
    answer:
      "GazPoint est conçu pour Douala, où le problème est quotidien. La couverture grandit au fur et à mesure que les points de vente rejoignent la plateforme.",
  },
  {
    question: "Comment savoir si le gaz est vraiment disponible ?",
    answer:
      "Chaque point affiche un statut et la date de sa dernière mise à jour. « Disponible » veut dire que le vendeur l'a signalé récemment. Quand l'information est ancienne, elle est marquée « à confirmer », et tu peux appeler avant de partir.",
  },
  {
    question: "Comment trouver un point de vente près de moi ?",
    answer:
      "Tu choisis ta marque, ton format et ta zone. Les points les plus proches s'affichent en premier, avec leur distance.",
  },
  {
    question: "Est-ce que je dois partager ma localisation ?",
    answer:
      "Non. Tu peux écrire ton quartier ou un point de repère. « Utiliser ma position » est une option, pas une obligation.",
  },
  {
    question: "Qui met à jour les disponibilités ?",
    answer:
      "Les vendeurs, en direct, quand leur stock change. L'administration met aussi à jour les fiches officielles des points de vente.",
  },
  {
    question: "Est-ce que je peux appeler le vendeur ?",
    answer:
      "Oui, s'il a laissé son numéro. Sinon, tu ouvres l'itinéraire et tu vas directement chez lui.",
  },
  {
    question: "GazPoint vend-il directement le gaz ?",
    answer:
      "Non. GazPoint ne vend rien. On te montre où acheter, et c'est toi qui vas chez le vendeur.",
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      className="w-full scroll-mt-16 py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Questions fréquentes
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Tu as une question&nbsp;?
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 lg:grid-cols-3">
          <Accordion className="rounded-2xl border bg-card px-5 lg:col-span-2 md:px-6">
            {questions.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="py-4 text-base font-medium hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="flex flex-col rounded-2xl border bg-card p-6">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircleQuestion className="size-4" />
            </span>

            <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
              Tu veux vérifier par toi-même
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Les points de vente autour de toi sont consultables directement, sans
              créer de compte.
            </p>

            <Button
              render={<Link href="/#trouver-du-gaz" />}
              nativeButton={false}
              className="mt-6 h-11 w-full gap-2"
            >
              Trouver du gaz
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          Cette page présente des exemples d&apos;informations. Les points de vente
          affichés sont fictifs, et la couverture réelle dépend des points de vente
          présents sur la plateforme.
        </p>
      </div>
    </section>
  )
}