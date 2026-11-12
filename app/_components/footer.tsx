"use client"

import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/lib/i18n"

export function Footer() {
  const t = useTranslation()

  // Raccourcis de navigation essentiels
  const shortcuts = [
    { label: "Accueil", href: "/" },
    { label: "Comment ça marche ?", href: "/#comment-ca-marche" },
    { label: "Trouver mon gaz", href: "/" },
    { label: "FAQ", href: "/#faq" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ]

  // Pages légales — uniquement les trois liens essentiels
  const legalPages = [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Confidentialité", href: "/politique-confidentialite" },
    { label: "CGU", href: "/cgu" },
  ]

  return (
    <footer className="bg-mint border-t border-border">
      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16 lg:py-20">
        {/* Section 1: Logo GazPoints complet, centré */}
        <div className="flex flex-col items-center gap-4 text-center mb-10">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/brand/logo.png"
              alt="GazPoints"
              width={24}
              height={24}
              className="size-5 object-contain shrink-0"
              style={{ width: "auto", height: "auto" }}
            />
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              GazPoints
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            {t("footer_tagline")}
          </p>
        </div>

        <div className="border-t border-border my-8 md:my-12"></div>

        {/* Sections 2-3: Raccourcis et Pages légales - centrées et compactes */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
          {/* Section 2: Raccourcis */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {t("footer_navigation")}
            </h3>
            <ul className="space-y-2 text-center">
              {shortcuts.map((item) => (
                <li key={`${item.label}-${item.href}`}>
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

          {/* Section 3: Pages légales */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Pages légales
            </h3>
            <ul className="space-y-2 text-center">
              {legalPages.map((item) => (
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
        <div className="border-t border-border my-8 md:my-10"></div>

        {/* Dernière ligne du footer - copyright + phrase, centrée */}
        <div className="py-4 md:px-6 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            © {new Date().getFullYear()} GazPoints. {t("footer_rights")}
          </p>
          <p className="text-xs text-muted-foreground">
            Fait pour faciliter l'accès au gaz au Cameroun.
          </p>
        </div>
      </div>
    </footer>
  )
}
