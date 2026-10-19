"use client"

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Compass,
  Footprints,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTrouverGaz } from "@/lib/use-trouver-gaz"

const painPoints = [
  {
    icon: Footprints,
    time: "07:30",
    title: "Le départ à l'aveugle",
    description:
      "Ton gaz se coupe en pleine préparation. Tu sors la bouteille vide et tu pars faire le tour du quartier sans certitude.",
  },
  {
    icon: AlertTriangle,
    time: "08:15",
    title: "Dépôts fermés ou en rupture",
    description:
      "Premier point fermé, deuxième en rupture de ta marque habituelle. La frustration monte et le temps défile.",
  },
  {
    icon: Banknote,
    time: "09:00",
    title: "Frais de transport cumulés",
    description:
      "Plusieurs allers-retours en moto-taxi ou taxi dépensés inutilement pour finalement rentrer les mains vides.",
  },
]

export function Storytelling() {
  const handleAction = useTrouverGaz()

  return (
    <section className="w-full bg-sand py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Titre & En-tête */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            <Compass className="size-3.5" />
            Situation courante
          </Badge>

          <h2 className="mt-6 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            La galère du matin où <br className="hidden sm:inline" />
            <span className="text-primary">ton gaz est fini</span>.
          </h2>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Une routine épuisante que tout le monde connaît, mais qui peut
            désormais être évitée en un clic.
          </p>
        </div>

        {/* Timeline / Cartes de situation */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {painPoints.map((item, idx) => (
            <Card
              key={item.title}
              className="transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                    <item.icon className="size-5" />
                  </span>
                  <Badge
                    variant="outline"
                    className="gap-1 font-semibold text-muted-foreground"
                  >
                    <Clock className="size-3" />
                    {item.time}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-base">
                  <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Étape 0{idx + 1}
                  </span>
                  <span className="mt-1 block font-bold text-foreground">
                    {item.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bilan & Résolution */}
        <Card className="mx-auto mt-8 max-w-4xl border-0 bg-white p-6 shadow-sm ring-1 ring-border sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <Badge variant="destructive" className="h-5 w-fit font-semibold">
                Le constat amer
              </Badge>
              <h4 className="text-lg font-bold text-foreground sm:text-xl">
                Argent dépensé en transport, matinée gâchée et repas retardé.
              </h4>
              <p className="text-sm text-muted-foreground">
                Personne ne t&apos;avait prévenu des ruptures de stock avant ton
                déplacement.
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-border bg-mint p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-primary-strong">
                <Sparkles className="size-4" />
                Avec GazPoints
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Disponibilité vérifiée en 10 sec
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  Trajet unique et direct
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  0 FCFA gaspillé en transport
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="mx-auto mt-12 max-w-xl text-center">
          <Button
            size="lg"
            className="h-12 w-full gap-2 px-8 text-base font-semibold shadow-md sm:w-auto cursor-pointer"
            onClick={handleAction}
          >
            Trouver mon gaz maintenant
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
