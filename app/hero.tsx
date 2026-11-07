import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RechercheGaz } from "@/app/_components/recherche-gaz"
import { PubliciteCarousel, type PubliciteBannerData } from "@/app/_components/publicite-banner"

const benefits = [
  "Vérifie la dispo avant de partir",
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

      {/* Dégradé sombre pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />

      {/* Contenu centré au-dessus */}
      <div className="relative z-10 container mx-auto px-4 pt-12 pb-16 md:py-20 flex flex-col items-center text-center">
        <div className="mx-auto max-w-3xl">
          <Badge
            variant="secondary"
            className="h-6 px-3 text-xs font-semibold uppercase tracking-[0.15em] bg-white/10 text-white border-white/20 backdrop-blur-sm"
          >
            Avant de te déplacer, vérifie d&apos;abord
          </Badge>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-lg">
            Ton gaz est fini&nbsp;?{" "}
            <span className="text-primary">Vérifie où il y en a avant de te déplacer.</span>
          </h1>

          <p className="mt-3 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow">
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
              variant="outline"
              className="h-11 px-6 text-sm bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white cursor-pointer backdrop-blur-sm rounded-xl"
              render={<Link href="/#comment-ca-marche" />}
              nativeButton={false}
            >
              Comment ça marche
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Proveurs rapides */}
        <ul className="mx-auto mt-8 max-w-3xl grid gap-3 sm:grid-cols-3 sm:gap-8">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2 text-left text-sm text-white/90 bg-white/10 rounded-sm px-3 py-2 backdrop-blur-sm border border-white/10 shadow-sm"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Check className="size-3" />
              </span>
              <span className="font-medium">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}