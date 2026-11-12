import { Building2, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function Fiabilite() {
  return (
    <section className="w-full bg-background py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-20 items-start">
          {/* Contenu — poussé vers la droite, modernisé */}
          <div className="order-2 lg:order-1 lg:pl-8 xl:pl-14 lg:pr-6 space-y-7 lg:space-y-10">
            <div>
              <Badge
                variant="secondary"
                className="inline-flex h-6 px-3 text-xs font-semibold uppercase tracking-[0.14em] bg-background shadow-xs ring-1 ring-background/80 mb-4"
              >
                <Building2 className="mr-1.5 size-3.5" />
                Fiabilité des informations
              </Badge>

              <h2 className="text-balance font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-[3.5rem] md:leading-[1.1]">
                Une information avec une date,{" "}
                <span className="text-primary">pas une promesse</span>
              </h2>

              <p className="mt-5 text-pretty text-lg text-muted-foreground leading-relaxed max-w-xl">
                Une disponibilité n&apos;est jamais affichée seule. Tu vois le
                statut, qui l&apos;a signalé, et le moment de la dernière mise
                à jour.
              </p>
            </div>

            <div>
              <h3 className="font-heading text-xl font-bold tracking-tight text-foreground mb-5">
                Qui met &agrave; jour l&apos;information
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="group rounded-2xl bg-gradient-to-br from-background to-mint/30 border border-primary/10 p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-mint text-primary-strong shadow-md ring-1 ring-border/40 mb-3 group-hover:scale-105 transition-transform">
                    <Store className="size-4" />
                  </span>
                  <p className="font-bold text-foreground">Les vendeurs</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Ils signalent leur stock au fil de la journée.
                  </p>
                </div>

                <div className="group rounded-2xl bg-gradient-to-br from-background to-sky/20 border border-primary/10 p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  <span className="inline-flex size-10 items-center justify-center rounded-xl bg-sky text-navy shadow-md ring-1 ring-border/40 mb-3 group-hover:scale-105 transition-transform">
                    <Building2 className="size-4" />
                  </span>
                  <p className="font-bold text-foreground">L&apos;administration</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Elle tient à jour les fiches officielles des points de
                    vente.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-mint/30 to-background border border-primary/15 p-6 md:p-8 shadow-xl shadow-primary/5">
              <h4 className="font-heading text-xl font-extrabold tracking-tight text-foreground mb-3">
                Ce que GazPoints ne te promet pas
              </h4>
              <div className="space-y-3 text-base leading-relaxed">
                <p className="text-muted-foreground">
                  Il ne peut pas garantir qu&apos;une bouteille restera
                  disponible jusqu&apos;à ce que tu arrives. Ce que tu vois
                  est ce qui a été signalé, à l&apos;heure indiquée.
                </p>
                <Separator className="bg-border/50" />
                <p className="font-semibold text-foreground">
                  Quand une information est ancienne, elle est marquée comme
                  telle. C&apos;est ça, la transparence.
                </p>
              </div>
            </div>
          </div>

          {/* Image droite — pleine, moderne avec aspect-ratio réservé */}
          <div className="order-1 lg:order-2 relative w-full overflow-hidden rounded-3xl shadow-2xl ring-4 ring-border/20 lg:sticky lg:top-24 aspect-[4/3] sm:aspect-[3/2] lg:aspect-[16/9]">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-3xl"
              style={{
                backgroundImage: 'url("/brand/1.webp")',
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
