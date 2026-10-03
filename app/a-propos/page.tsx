import type { Metadata } from "next"
import { AproposCta } from "@/app/_components/apropos-cta"
import { AproposHero } from "@/app/_components/apropos-hero"
import { Equipe } from "@/app/_components/equipe"
import { NotreDemarche } from "@/app/_components/notre-demarche"
import { NotreMethode } from "@/app/_components/notre-methode"
import { NotrePromesse } from "@/app/_components/notre-promesse"

export const metadata: Metadata = {
  title: { absolute: "À propos | GazPoint" },
  description:
    "GazPoint est un service d’information sur les points de vente de gaz de cuisson à Douala. Notre point de départ, nos engagements et la manière dont l’information est vérifiée.",
}

export default function APropos() {
  return (
    <>
      <AproposHero />
      <NotreDemarche />
      <NotrePromesse />
      <NotreMethode />
      <Equipe />
      <AproposCta />
    </>
  )
}