import { Hero } from "@/app/hero"
import { Acces } from "@/app/_components/acces"
import { Benefices } from "@/app/_components/benefices"
import { CtaFinal } from "@/app/_components/cta-final"
import { Demonstration } from "@/app/_components/demonstration"
import { Faq } from "@/app/_components/faq"
import { Fiabilite } from "@/app/_components/fiabilite"
import { Solution } from "@/app/_components/solution"
import { Storytelling } from "@/app/_components/storytelling"
import { Temoignages } from "@/app/_components/temoignages"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"

export default function Home() {
  return (
    <>
      <Hero />
      <Storytelling />
      <Benefices />
      <Solution />
      <TrouverMonGaz />
      <Demonstration />
      <Fiabilite />
      <Faq />
      <Temoignages />
      <Acces />
      <CtaFinal />
    </>
  )
}