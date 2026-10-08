"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Store,
  Truck,
  User,
  UserCheck,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/vendeurs", label: "Vendeurs", icon: UserCheck },
    { href: "/admin/collaborateurs", label: "Collaborateurs", icon: Shield },
    { href: "/admin/disponibilites", label: "Disponibilités", icon: Package },
    { href: "/admin/points-de-vente", label: "Points de vente", icon: Store },
    { href: "/admin/statistiques", label: "Statistiques", icon: Activity },
    { href: "/admin/profil", label: "Mon profil", icon: User },
    { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  ]

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <nav
      aria-label="Navigation administration"
      className="flex h-full flex-col"
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-bold text-lg"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="size-5" />
          </span>
          <span>GasPoint Admin</span>
        </Link>
      </div>

      <ul className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="border-t p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Package className="size-4" aria-hidden />
          Espace vendeur
        </Link>
      </div>
    </nav>
  )
}