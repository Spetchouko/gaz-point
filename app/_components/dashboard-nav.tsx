"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquarePlus, Store, User, Calendar, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardNavProps = {
  pro?: boolean
  isVendor?: boolean
}

export function DashboardNav({ pro = false, isVendor = false }: DashboardNavProps) {
  const pathname = usePathname()

  const clientLinks = [
    { href: "/dashboard", label: "Rechercher", icon: Search },
    { href: "/dashboard/reservations", label: "Mes réservations", icon: Calendar },
    { href: "/avis", label: "Donner mon avis", icon: MessageSquarePlus },
    { href: "/profil", label: "Mon profil", icon: User },
  ]

  const vendorLinks = [
    { href: "/dashboard/vendeur", label: "Espace vendeur", icon: Store },
    { href: "/dashboard/vendeur/espace-pro", label: "Espace pro", icon: Store },
    { href: "/avis", label: "Donner mon avis", icon: MessageSquarePlus },
    { href: "/profil", label: "Mon profil", icon: User },
  ]

  // For vendors, combine both sets of links so they can switch between modes
  const links = isVendor
    ? [
        // Vendor features
        { href: "/dashboard/vendeur", label: "Espace vendeur", icon: Store },
        { href: "/dashboard/vendeur/espace-pro", label: "Espace pro", icon: Store },
        // Client features
        { href: "/dashboard", label: "Rechercher", icon: Search },
        { href: "/dashboard/reservations", label: "Mes réservations", icon: Calendar },
        // Common
        { href: "/avis", label: "Donner mon avis", icon: MessageSquarePlus },
        { href: "/profil", label: "Mon profil", icon: User },
      ]
    : pro
    ? vendorLinks
    : clientLinks

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <nav
      aria-label="Navigation du tableau de bord"
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
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
