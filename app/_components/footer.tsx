"use client"

import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/lib/i18n"

function FooterNav({
  title,
  items,
  t,
}: {
  title: string
  items: { label?: string; labelKey?: string; href: string }[]
  t: (k: string) => string
}) {
  return (
    <nav aria-label={title}>
      <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {t(title)}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.labelKey ? t(item.labelKey) : item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  const t = useTranslation()

  const navigation = [
    { labelKey: "nav_how", href: "/#comment-ca-marche" },
    { labelKey: "button_find_gas", href: "/#trouver-du-gaz" },
    { labelKey: "nav_faq", href: "/#faq" },
  ]

  const gazpoint = [
    { labelKey: "nav_about", href: "/a-propos" },
    { label: "Services", href: "/services" },
    { labelKey: "nav_contact", href: "/contact" },
    { labelKey: "nav_home", href: "/" },
  ]

  const legal = [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "Conditions d'utilisation", href: "/cgu" },
    { label: "Politique de confidentialité", href: "/politique-confidentialite" },
    { label: "Politique cookies", href: "/politique-cookies" },
    { label: "Conditions de vente", href: "/cgv" },
  ]

  return (
    <footer className="w-full bg-mint">
      <div className="container mx-auto px-4 py-12 pb-20 md:py-14 md:pb-20">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:gap-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-6 w-6 object-contain shrink-0"
              />
              GazPoints
            </Link>

            <p className="mt-4 max-w-xs text-pretty text-sm text-muted-foreground">
              {t("footer_tagline")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:contents">
            <FooterNav title="footer_navigation" items={navigation} t={t} />
            <FooterNav title="footer_gazpoints" items={gazpoint} t={t} />
            <FooterNav title="footer_legal" items={legal} t={t} />
          </div>
        </div>

        <div className="mt-10">
          <Separator className="bg-border" />
          <div className="flex flex-col gap-2 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {t("footer_company")}. {t("footer_rights")}.</p>
            <p>Fait à Douala, Cameroun.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}