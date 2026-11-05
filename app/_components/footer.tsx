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
      <div className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Section 1: Identité GazPoints */}
          <div>
            <div className="flex items-center gap-2 mb-6">
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
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer_tagline")}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Douala, Cameroun
            </p>
          </div>

          {/* Section 2: Navigation */}
          <nav>
            <h3 className="font-semibold text-sm text-muted-foreground mb-4 underline underline-offset-2 underline-offset-black">
              Navigation
            </h3>
            <ul className="space-y-2">
              {navigation.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.labelKey ? t(item.labelKey) : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Section 3: Espace Utilisateur */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-4 underline underline-offset-2 underline-offset-black">
            Espace Utilisateur
          </h3>
          <ul className="space-y-2">
            {userSpace.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.labelKey ? t(item.labelKey) : item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 4: Informations et Legal */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-4 underline underline-offset-2 underline-offset-black">
            Informations et Legal
          </h3>
          <ul className="space-y-2">
            {legal.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.labelKey ? t(item.labelKey) : item.label}
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
      <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GazPoints. Tous droits réservés.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Fait pour faciliter l'accès au gaz au Cameroun.
        </p>
      </div>
    </footer>
  )
}