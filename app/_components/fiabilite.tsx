import { Building2, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function Fiabilite() {
  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]"
          >
            <Building2 className="mr-2 size-3.5" />
            Fiabilité des informations
          </Badge>

          <h2 className="mt-6 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Une information avec une date,{" "}
            <span className="text-primary">pas une promesse</span>
          </h2>

          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Une disponibilité n&apos;est jamais affichée seule. Tu vois le statut,
            qui l&apos;a signalé, et le moment de la dernière mise à jour.
          </p>
        </div>

        {/* Qui met à jour */}
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            Qui met à jour l&apos;information
          </h3>

          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            <li className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint text-primary-strong">
                <Store className="size-4" />
              </span>
              <p className="font-medium text-foreground">Les vendeurs</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ils signalent leur stock au fil de la journée.
              </p>
            </li>

            <li className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky text-navy">
                <Building2 className="size-4" />
              </span>
              <p className="font-medium text-foreground">L&apos;administration</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Elle tient à jour les fiches officielles des points de vente.
              </p>
            </li>
          </ul>
        </div>

        <Card className="mx-auto mt-12 max-w-4xl border-0 bg-mint p-6 sm:p-8">
          <CardHeader className="px-0">
            <CardTitle className="font-heading text-xl font-semibold">
              Ce que GazPoints ne te promet pas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="text-pretty text-muted-foreground">
              Il ne peut pas garantir qu&apos;une bouteille restera disponible
              jusqu&apos;à ce que tu arrives. Ce que tu vois est ce qui a été
              signalé, à l&apos;heure indiquée.
            </p>

            <Separator className="my-4 bg-border" />

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
