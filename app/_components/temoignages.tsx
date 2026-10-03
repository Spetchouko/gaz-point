import { MapPin, Quote, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

function Avatar({
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
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn("size-12 shrink-0 rounded-full object-cover", className)}
      />
    )
  }

  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary",
        className
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function TemoignageCard({ item }: { item: Temoignage }) {
  return (
    <li className="flex flex-col rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-3">
        <Avatar name={item.name} avatarUrl={item.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{item.name}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {item.city}
          </p>
        </div>
      </div>

      <Quote
        className="mt-5 size-5 shrink-0 text-muted-foreground/40"
        aria-hidden
      />
      <p className="mt-2 flex-1 text-pretty text-foreground">{item.quote}</p>

      <Badge variant="secondary" className="mt-6 w-fit">
        {typeLabel[item.type]}
      </Badge>
    </li>
  )
}

function CarteEnAttente() {
  return (
    <li className="flex flex-col rounded-2xl border border-dashed bg-card/40 p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground/50">
          <User className="size-5" />
        </span>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-2.5 w-32 rounded-full bg-muted/70" />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="h-2.5 w-full rounded-full bg-muted/70" />
        <div className="h-2.5 w-11/12 rounded-full bg-muted/70" />
        <div className="h-2.5 w-8/12 rounded-full bg-muted/70" />
      </div>

      <div className="mt-auto pt-6">
        <span className="inline-block h-5 w-24 rounded-md border border-dashed" />
      </div>
    </li>
  )
}

export function Temoignages() {
  const hasTestimonials = temoignages.length > 0

  return (
    <section className="w-full border-y py-16 md:py-24 bg-gradient-section-reverse">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Ils utilisent GazPoint
          </p>

          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
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
          <>
            <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted-foreground">
              En attendant, voici la place que chacun occupera.
            </p>

            <ul className="mx-auto mt-6 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CarteEnAttente />
              <CarteEnAttente />
              <CarteEnAttente />
            </ul>
          </>
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

        {!hasTestimonials && (
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
            Aucun témoignage n&apos;est inventé. Les cartes se rempliront avec de
            vrais propos, et uniquement avec l&apos;accord des personnes
            concernées.
          </p>
        )}
      </div>
    </section>
  )
}