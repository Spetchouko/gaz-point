import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RechercheGaz } from "@/app/_components/recherche-gaz"
import { PubliciteCarousel, type PubliciteBannerData } from "@/app/_components/publicite-banner"

const benefits = [
  "Vérifie la disponibilité avant de partir",
  "Trouve un point de vente proche",
  "Évite les déplacements inutiles",
]

export function Hero({
  searchPublicites,
}: {
  searchPublicites?: PubliciteBannerData[]
}) {
  return (
    <section id="accueil" className="relative w-full overflow-hidden min-h-[560px] md:min-h-[640px]">
      {/* Image de fond */}
      <Image
        src="/brand/hero.webp"
        alt="GazPoints"
        fill
        className="object-cover"
        priority
      />

      {/* Voile noir pour assombrir la photo sans la masquer */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Contenu centré au-dessus */}
      <div className="relative z-10 container mx-auto px-4 pt-12 pb-16 md:py-20 flex flex-col items-center text-center">
        <div className="mx-auto max-w-3xl">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em] bg-white text-primary border border-primary/20 shadow-sm"
          >
            Vérifiez d’abord où il y en a
          </Badge>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            Ton gaz est fini&nbsp;?{" "}
            <span className="text-[#4ADE80] font-extrabold">Vérifiez où il y en a avant de vous déplacer.</span>
          </h1>

          <p className="mt-3 text-lg sm:text-xl text-white max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            GazPoints te montre les points de vente de gaz près de chez toi, avec la
            disponibilité, la distance et le numéro du vendeur.
          </p>
        </div>

        {/* Recherche */}
        <div
          id="trouver-du-gaz"
          className="mx-auto mt-8 max-w-3xl"
        >
          {searchPublicites && searchPublicites.length > 0 && (
            <PubliciteCarousel
              publicites={searchPublicites}
              className="mb-6 py-6 md:py-8"
            />
          )}
          <RechercheGaz />

          <div className="mt-5 flex justify-center">
            <Button
              size="lg"
              variant="default"
              className="h-11 px-6 text-sm text-primary-foreground rounded-xl"
              render={<Link href="/#comment-ca-marche" />}
              nativeButton={false}
            >
              Comment ça marche
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Avantages clés */}
        <ul className="mx-auto mt-8 max-w-3xl grid gap-3 sm:grid-cols-3 sm:gap-8">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2 text-left text-sm text-foreground bg-white rounded-sm px-3 py-2 shadow-sm border border-border"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
              <span className="font-medium text-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
