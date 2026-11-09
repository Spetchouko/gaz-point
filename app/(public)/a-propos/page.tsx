import type { Metadata } from "next"
import { Fragment } from "react"
import { SoftSeparator } from "@/app/_components/soft-separator"
import { AproposCta } from "@/app/_components/apropos-cta"
import { AproposHero } from "@/app/_components/apropos-hero"
import { Equipe } from "@/app/_components/equipe"
import { NotreDemarche } from "@/app/_components/notre-demarche"
import { NotreMethode } from "@/app/_components/notre-methode"
import { NotrePromesse } from "@/app/_components/notre-promesse"

export const metadata: Metadata = {
  title: { absolute: "À propos | GazPoints" },
  description:
    "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala. Profil usager gratuit à vie, espace vendeur à 5 000 FCFA/mois : notre point de départ, nos engagements et la vérification de l'information.",
}

export default function APropos() {
  return (
    <div className="min-h-screen bg-[var(--section-green)] overflow-x-hidden">
      <Fragment>
        <AproposHero />
        <SoftSeparator />
        <NotreDemarche />
        <SoftSeparator />
        <NotrePromesse />
        <SoftSeparator />
        <NotreMethode />
        <SoftSeparator />
        <Equipe />
        <SoftSeparator />
        <AproposCta />
      </Fragment>
    </div>
  )
}