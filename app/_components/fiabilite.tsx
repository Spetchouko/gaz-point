import { Building2, Clock, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  demoPoints,
} from "@/app/_components/donnees-demo"

export function Fiabilite() {
  const examples = [demoPoints[0], demoPoints[2], demoPoints[4]]

  return (
    <section className="w-full border-y bg-linear-to-b from-muted/30 via-muted/60 to-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            <Building2 className="size-3.5 mr-2" />
            Fiabilité des informations
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une information avec une date,{" "}
            <span className="text-primary">pas une promesse</span>
          </h2>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Une disponibilité n&apos;est jamais affichée seule. Tu vois le statut,
            qui l&apos;a signalé, et le moment de la dernière mise à jour.
          </p>
        </div>

        {/* Exemples de points de vente - cartes centrées */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {examples.map((point) => {
            return (
              <Card
                key={point.id}
                className="transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                      <Store className="size-5" />
                    </span>
                    <Badge variant="outline" className="gap-1 font-semibold text-muted-foreground">
                      <Clock className="size-3" />
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-base font-medium">
                    {point.brands.join(" · ")} — {point.formats.join(" · ")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {point.district} · {point.distanceKm.toFixed(1).replace(".", ",")} km
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Qui met à jour - centered */}
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Qui met à jour l&apos;information
          </h3>

          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            <li className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="size-4" />
              </span>
              <p className="font-medium text-foreground">Les vendeurs</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ils signalent leur stock au fil de la journée.
              </p>
            </li>

            <li className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </span>
              <p className="font-medium text-foreground">
                L&apos;administration
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Elle tient à jour les fiches officielles des points de vente.
              </p>
            </li>
          </ul>
        </div>

        <Card className="mx-auto mt-16 max-w-4xl border-0 bg-linear-to-r from-destructive/5 via-amber-500/5 to-primary/5 p-6 sm:p-8 shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-xl font-semibold">
              Ce que GazPoints ne te promet pas
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
    </section>
  )
}