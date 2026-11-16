import type { Metadata } from "next"
import { SoftSeparator } from "@/app/_components/soft-separator"
import { ContactCanaux } from "@/app/_components/contact-canaux"
import { ContactFaq } from "@/app/_components/contact-faq"
import { ContactForm } from "@/app/_components/contact-form"
import { ContactHero } from "@/app/_components/contact-hero"
import { ContactVendeurs } from "@/app/_components/contact-vendeurs"
import { WebPageJsonLd } from "@/app/_components/json-ld"

export const metadata: Metadata = {
  title: { absolute: "Contact | GazPoints" },
  description:
    "Écris à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signale une information fausse, un point de vente manquant, ou rejoins GazPoints en tant que vendeur (5 000 FCFA/mois).",
}

export default function Contact() {
  return (
    <>
      <WebPageJsonLd
        name="Contact | GazPoints"
        description="Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois)."
        url="https://www.gazpoints.com/contact"
      />
      <ContactHero />
      <SoftSeparator />
      <ContactCanaux />
      <SoftSeparator />
      <ContactForm />
      <SoftSeparator />
      <ContactVendeurs />
      <SoftSeparator />
      <ContactFaq />
    </>
  )
}