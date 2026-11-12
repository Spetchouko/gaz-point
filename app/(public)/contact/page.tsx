import type { Metadata } from "next"
import { SoftSeparator } from "@/app/_components/soft-separator"
import { ContactCanaux } from "@/app/_components/contact-canaux"
import { ContactFaq } from "@/app/_components/contact-faq"
import { ContactForm } from "@/app/_components/contact-form"
import { ContactHero } from "@/app/_components/contact-hero"
import { ContactVendeurs } from "@/app/_components/contact-vendeurs"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gazpoints.com"

export const metadata: Metadata = {
  title: { absolute: "Contact | GazPoints" },
  description:
    "Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois).",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${SITE_URL}/contact`,
    siteName: "GazPoints",
    title: "Contact | GazPoints",
    description:
      "Contactez GazPoints pour toute question sur la disponibilité du gaz au Cameroun.",
    images: [
      {
        url: `${SITE_URL}/brand/hero.webp`,
        width: 1200,
        height: 630,
        alt: "Contact GazPoints",
      },
    ],
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
}

export default function Contact() {
  return (
    <>
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