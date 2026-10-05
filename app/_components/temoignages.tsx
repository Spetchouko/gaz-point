import { MapPin, Quote, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type TemoignageType = "particulier" | "vendeur"

export type Temoignage = {
  id: string
  name: string
  city: string
  quote: string
  type: TemoignageType
  avatarUrl?: string
}

export const typeLabel: Record<TemoignageType, string> = {
  particulier: "Particulier",
  vendeur: "Vendeur",
}

// Aucun témoignage réel pour l'instant : rien n'est inventé pour remplir la grille.
// Renseigner ce tableau avec de vrais propos vérifiés, et la section s'affiche seule.
export const temoignages: Temoignage[] = []

function AvatarMark({
  name,
  avatarUrl,
  className,
}: {
  name: string
  avatarUrl?: string
  className?: string
}) {
  if (avatarUrl) {
    return (
      <Avatar className={cn("size-12 shrink-0", className)}>
        <AvatarImage src={avatarUrl} alt="" />
        <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={cn("size-12 shrink-0", className)}>
      <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

export function TemoignageCard({ item }: { item: Temoignage }) {
  return (
    <li>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AvatarMark name={item.name} avatarUrl={item.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{item.name}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {item.city}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <Quote
            className="size-5 shrink-0 text-muted-foreground/40"
            aria-hidden
          />
          <p className="mt-2 flex-1 text-pretty text-foreground">{item.quote}</p>
        </CardContent>

        <CardFooter className="border-t bg-muted/30">
          <Badge variant="secondary" className="w-fit">
            {typeLabel[item.type]}
          </Badge>
        </CardFooter>
      </Card>
    </li>
  )
}

function CarteEnAttente() {
  return (
    <li>
      <Card className="h-full border-dashed bg-card/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground/50">
              <User className="size-5" />
            </span>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-muted" />
              <div className="h-2.5 w-32 rounded-full bg-muted/70" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-full bg-muted/70" />
            <div className="h-2.5 w-11/12 rounded-full bg-muted/70" />
            <div className="h-2.5 w-8/12 rounded-full bg-muted/70" />
          </div>
        </CardContent>

        <CardFooter className="mt-auto border-t bg-muted/30">
          <span className="inline-block h-5 w-24 rounded-md border border-dashed" />
        </CardFooter>
      </Card>
    </li>
  )
}

export function Temoignages() {
  const hasTestimonials = temoignages.length > 0

  return (
    <section className="w-full border-y py-16 md:py-24 bg-gradient-section-reverse">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Ils utilisent GazPoint
          </Badge>

          <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            La parole à ceux qui l&apos;utilisent
          </h2>

          <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
            {hasTestimonials
              ? "Des particuliers et des vendeurs racontent ce que GazPoint a changé pour eux."
              : "Dès que des particuliers et des vendeurs auront utilisé GazPoint, leurs mots apparaîtront ici."}
          </p>
        </div>

        {hasTestimonials ? (
          <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {temoignages.map((item) => (
              <TemoignageCard key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CarteEnAttente />
            <CarteEnAttente />
            <CarteEnAttente />
          </ul>
        )}

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Deux profils
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline">Particuliers</Badge>
            <Badge variant="outline">Vendeurs</Badge>
          </div>
        </div>
      </div>
    </section>
  )
}