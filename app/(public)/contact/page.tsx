import type { Metadata } from "next"
import { ContactCanaux } from "@/app/_components/contact-canaux"
import { ContactFaq } from "@/app/_components/contact-faq"
import { ContactForm } from "@/app/_components/contact-form"
import { ContactHero } from "@/app/_components/contact-hero"
import { ContactVendeurs } from "@/app/_components/contact-vendeurs"
import { WebPageJsonLd } from "@/app/_components/json-ld"
import { FAQPageJsonLd } from "@/app/_components/json-ld"
import { BreadcrumbJsonLd } from "@/app/_components/json-ld"

const now = new Date().toISOString()

export const metadata: Metadata = {
  title: { absolute: "Contact | GazPoints" },
  description:
    "Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois).",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.gazpoints.com/contact",
    siteName: "GazPoints",
    title: "Contact | GazPoints",
    description:
      "Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois).",
  },
  twitter: {
    card: "summary",
    title: "Contact | GazPoints",
    description:
      "Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois).",
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Breadcrumb data for contact page
const contactBreadcrumb = [
  { name: "Accueil", url: "https://www.gazpoints.com" },
  { name: "Contact", url: "https://www.gazpoints.com/contact" },
]

export default function Contact() {
  const questions = [
    {
      question: "Comment signaler une information fausse ?",
      answer:
        "Vous pouvez nous contacter via le formulaire ou nous indiquer la fiche qui pose problème. Nous vérifierons et mettrons à jour les informations.",
    },
    {
      question: "Comment devenir vendeur sur GazPoints ?",
      answer:
        "Rejoignez notre espace vendeur pour 5 000 FCFA/mois. Inscription des points de vente, publication d'offres et gestion des disponibilités.",
    },
    {
      question: "Quelles sont les coordonnées de GazPoints ?",
      answer:
        "Vous pouvez nous écrire à contact@gazpoints.com ou nous appeler au +237672072550. Nous sommes basés à Douala.",
    },
  ]

  return (
    <>
      <WebPageJsonLd
        name="Contact | GazPoints"
        description="Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois)."
        url="https://www.gazpoints.com/contact"
        datePublished={now}
        dateModified={now}
      />
      <FAQPageJsonLd
        name="Contact | GazPoints"
        description="Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois)."
        questions={questions}
      />
      <BreadcrumbJsonLd items={[
        { name: "Accueil", url: "https://www.gazpoints.com" },
        { name: "Contact", url: "https://www.gazpoints.com/contact" },
      ]}
      />
      <ContactHero />
      <ContactCanaux />
      <ContactForm />
      <ContactVendeurs />
      <ContactFaq />
    </>
  )
}
