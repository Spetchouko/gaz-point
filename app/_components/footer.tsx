"use client"

import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/lib/i18n"

type FooterColumn = {
  title: string
  items: { label?: string; labelKey?: string; href: string }[]
}

export function Footer() {
  const t = useTranslation()

  // Section 1: Identité GazPoints
  const identity: FooterColumn = {
    title: "footer_identity",
    items: [
      { label: "GazPoints", href: "/" },
      {
        label: t("footer_tagline"),
        href: "/",
      },
    ],
  }

  // Section 2: Navigation
  const navigation: FooterColumn = {
    title: "footer_navigation",
    items: [
      { labelKey: "nav_home", href: "/" },
      { labelKey: "nav_how", href: "/#comment-ca-marche" },
      { labelKey: "nav_faq", href: "/#faq" },
      { labelKey: "nav_about", href: "/a-propos" },
      { labelKey: "nav_contact", href: "/contact" },
    ],
  }

  // Section 3: Espace Utilisateur
  const userSpace: FooterColumn = {
    title: "footer_user_space",
    items: [
      { label: "Créer un compte", href: "/inscription" },
      { label: "Se connecter", href: "/connexion" },
      { label: "Espace vendeur", href: "/dashboard/vendeur" },
      { label: "Devenir vendeur", href: "/devenir-vendeur" },
    ],
  }

  // Section 4: Informations et Legal
  const legal: FooterColumn = {
    title: "footer_legal",
    items: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Politique de confidentialité", href: "/politique-confidentialite" },
      { label: "Conditions d'utilisation", href: "/cgu" },
      { label: "Conditions de vente", href: "/cgv" },
      { label: "Politique cookies", href: "/politique-cookies" },
    ],
  }

  return (
    <footer className="bg-mint border-t border-border">
      <div className="container mx-auto max-w-7xl px-4 py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:gap-8">
          {/* Section 1: Logo et présentation GazPoints */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={28}
                height={28}
                className="h-6 w-6 object-contain shrink-0"
              />
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">GazPoints</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("footer_tagline")}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Douala, Cameroun
            </p>
          </div>

          {/* Section 2: Navigation */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              {[
                { labelKey: "nav_home", href: "/" },
                { labelKey: "nav_how", href: "/#comment-ca-marche" },
                { labelKey: "nav_faq", href: "/#faq" },
                { labelKey: "nav_about", href: "/a-propos" },
                { labelKey: "nav_contact", href: "/contact" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Informations sur les utilisateurs */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">
              Espace Utilisateur
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Créer un compte", href: "/inscription" },
                { label: "Se connecter", href: "/connexion" },
                { label: "Espace vendeur", href: "/dashboard/vendeur" },
                { label: "Devenir vendeur", href: "/devenir-vendeur" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4: Contact et mentions légales */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">
              Informations légales
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Mentions légales", href: "/mentions-legales" },
                { label: "Politique de confidentialité", href: "/politique-confidentialite" },
                { label: "Conditions d'utilisation", href: "/cgu" },
                { label: "Conditions de vente", href: "/cgv" },
                { label: "Politique cookies", href: "/politique-cookies" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ligne de séparation avant le copyright */}
        <div className="border-t border-border my-12 md:my-16">
          <Separator orientation="horizontal" className="my-4" />
        </div>

        {/* Dernière ligne du footer */}
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GazPoints. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Fait pour faciliter l'accès au gaz au Cameroun.
          </p>
        </div>
      </div>
    </footer>
  )
}