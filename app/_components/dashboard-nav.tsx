"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, LayoutDashboard, Package, Store, User } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardNavProps = {
  pro?: boolean
}

export function DashboardNav({ pro = false }: DashboardNavProps) {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/mes-commandes", label: "Mes commandes", icon: Package },
    { href: "/mes-favoris", label: "Mes favoris", icon: Heart },
    { href: "/profil", label: "Mon profil", icon: User },
    ...(pro ? [{ href: "/dashboard/pro", label: "Espace pro", icon: Store }] : []),
  ]

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <nav
      aria-label="Navigation du tableau de bord"
      className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex w-max gap-1 rounded-xl border bg-card p-1">
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
