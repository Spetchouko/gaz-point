"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquarePlus, Store, User, Calendar, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

type DashboardNavProps = {
  pro?: boolean
  isVendor?: boolean
}

export function DashboardNav({ pro = false, isVendor = false }: DashboardNavProps) {
  const t = useTranslation()
  const pathname = usePathname()

  const clientLinks: { href: string; label?: string; labelKey?: string; icon: typeof Search }[] = [
    { href: "/dashboard", labelKey: "button_find_gas", icon: Search },
    { href: "/dashboard/reservations", labelKey: "nav_reservations", icon: Calendar },
    { href: "/avis", labelKey: "nav_avis", icon: MessageSquarePlus },
    { href: "/profil", labelKey: "nav_profil", icon: User },
  ]

  const vendorLinks: { href: string; label?: string; labelKey?: string; icon: typeof Search }[] = [
    { href: "/dashboard/vendeur", labelKey: "dashboard_vendeur_title", icon: Store },
    { href: "/dashboard/vendeur/espace-pro", labelKey: "label_permissions", icon: Store },
    { href: "/avis", labelKey: "nav_avis", icon: MessageSquarePlus },
    { href: "/profil", labelKey: "nav_profil", icon: User },
  ]

  // For vendors, combine both sets of links so they can switch between modes
  const links: { href: string; label?: string; labelKey?: string; icon: typeof Search }[] = isVendor
    ? [
        // Vendor features
        { href: "/dashboard/vendeur", labelKey: "dashboard_vendeur_title", icon: Store },
        { href: "/dashboard/vendeur/espace-pro", labelKey: "label_permissions", icon: Store },
        // Client features
        { href: "/dashboard", labelKey: "button_find_gas", icon: Search },
        { href: "/dashboard/reservations", labelKey: "nav_reservations", icon: Calendar },
        // Common
        { href: "/avis", labelKey: "nav_avis", icon: MessageSquarePlus },
        { href: "/profil", labelKey: "nav_profil", icon: User },
      ]
    : pro
    ? vendorLinks
    : clientLinks

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <nav
      aria-label={t("nav_dashboard")}
      className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex w-max gap-1 rounded-xl border border-border bg-card p-1">
        {links.map((link) => {
          const active = isActive(link.href)
          const Icon = link.icon
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {link.labelKey ? t(link.labelKey) : link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
