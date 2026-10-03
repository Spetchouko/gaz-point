import type { Metadata } from "next"
import { ContactCanaux } from "@/app/_components/contact-canaux"
import { ContactFaq } from "@/app/_components/contact-faq"
import { ContactHero } from "@/app/_components/contact-hero"
import { ContactSujets } from "@/app/_components/contact-sujets"
import { ContactVendeurs } from "@/app/_components/contact-vendeurs"

export const metadata: Metadata = {
  title: { absolute: "Contact | GazPoint" },
  description:
    "Écris à GazPoint : email, téléphone, WhatsApp et adresse à Douala. Signale une information fausse, un point de vente manquant, ou rejoins GazPoint en tant que revendeur.",
}

export default function Contact() {
  return (
    <>
      <ContactHero />
      <ContactCanaux />
      <ContactSujets />
      <ContactVendeurs />
      <ContactFaq />
    </>
  )
}