import { Building2, Clock, ShieldCheck, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusDot } from "@/app/_components/statuts"
import {
  availabilityLabel,
  demoPoints,
  formatAge,
  type Availability,
  type GasSource,
} from "@/app/_components/donnees-demo"

const statusNote: Record<Availability, string> = {
  disponible: "Le vendeur a confirmé il y a quelques minutes.",
  à_confirmer:
    "Information pas encore confirmée par le vendeur. Appelle avant de partir.",
  indisponible: "Le point est signalé comme épuisé. Rien n'est caché.",
}

const sourceLabel: Record<GasSource, string> = {
  vendeur: "Signalé par le vendeur",
  administration: "Mis à jour par l'administration",
}

const sourceIcon: Record<GasSource, typeof Store> = {
  vendeur: Store,
  administration: Building2,
}

export function Fiabilite() {
  const examples = [demoPoints[0], demoPoints[2], demoPoints[4]]

  return (
    <section className="w-full border-y bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Fiabilité des informations
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une information avec une date,{" "}
            <span className="text-primary">pas une promesse</span>
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            Une disponibilité n&apos;est jamais affichée seule. Tu vois le statut,
            qui l&apos;a signalé, et le moment de la dernière mise à jour.
          </p>
        </div>

        <p className="mt-14 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Exemple de ce que tu vois dans les résultats
        </p>

        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {examples.map((point) => {
            const Source = sourceIcon[point.updatedBy]

            return (
              <li key={point.id}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <StatusDot status={point.status} />
                      <span className="text-sm font-semibold text-foreground">
                        {availabilityLabel[point.status]}
                      </span>
                    </div>

                    <CardTitle className="mt-3 text-base font-medium">
                      {point.brands.join(" · ")} — {point.formats.join(" · ")}
                    </CardTitle>
                    <CardDescription>
                      {point.district} · {point.distanceKm.toFixed(1).replace(".", ",")} km
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-1.5 border-t pt-3 text-sm text-muted-foreground">
                      <p className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        Mis à jour {formatAge(point.updatedMinutesAgo)}
                      </p>
                      <p className="inline-flex items-center gap-1.5">
                        <Source className="size-3.5" />
                        {sourceLabel[point.updatedBy]}
                      </p>
                    </div>

                    <p className="mt-4 text-pretty text-sm text-foreground">
                      {statusNote[point.status]}
                    </p>

                    {point.verified && (
                      <Badge variant="secondary" className="mt-4 w-fit gap-1">
                        <ShieldCheck className="size-3" />
                        Vendeur vérifié
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Qui met à jour l&apos;information
            </h3>

            <ul className="mt-6 space-y-5">
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">Les vendeurs</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ils signalent leur stock au fil de la journée.
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    L&apos;administration
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Elle tient à jour les fiches officielles des points de vente.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <Card className="p-6">
            <CardHeader className="px-0">
              <CardTitle className="text-xl font-semibold">
                Ce que GazPoint ne te promet pas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <p className="text-pretty text-muted-foreground">
                Il ne peut pas garantir qu&apos;une bouteille restera disponible
                jusqu&apos;à ce que tu arrives. Ce que tu vois est ce qui a été
                signalé, à l&apos;heure indiquée.
              </p>

              <Separator className="my-4" />

              <p className="text-pretty font-medium text-foreground">
                Quand une information est ancienne, elle est marquée comme telle.
                C&apos;est ça, la transparence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}