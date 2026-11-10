import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  User,
  MapPin,
  Cylinder,
  Shield,
} from "lucide-react"
import type { ComponentType } from "react"

export type DashboardNavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** Sous-items optionnels (menu dépliable, style Outlook) */
  subItems?: DashboardNavItem[]
}

export type DashboardNavSection = {
  key: string
  label: string
  items: DashboardNavItem[]
}

export type DashboardRole = "client" | "vendor"

export function getClientNavSections(): DashboardNavSection[] {
  return [
    {
      key: "navigation",
      label: "Navigation",
      items: [
        { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
        {
          href: "/dashboard/reservations",
          label: "Mes réservations",
          icon: Calendar,
        },
        {
          href: "/dashboard/historique-codes",
          label: "Historique des codes",
          icon: FileText,
        },
      ],
    },
    {
      key: "compte",
      label: "Compte",
      items: [
        { href: "/avis", label: "Donner mon avis", icon: MessageSquare },
        { href: "/profil", label: "Mon profil", icon: User },
      ],
    },
  ]
}

export function getVendorNavSections(): DashboardNavSection[] {
  return [
    {
      key: "navigation",
      label: "Navigation",
      items: [
        { href: "/dashboard/vendeur", label: "Tableau de bord", icon: LayoutDashboard },
        {
          href: "/dashboard/vendeur/points-de-vente",
          label: "Mon point de vente",
          icon: MapPin,
        },
        {
          href: "/dashboard/vendeur/disponibilites",
          label: "Disponibilités de gaz",
          icon: Cylinder,
        },
        {
          href: "/dashboard/vendeur/reservations",
          label: "Mes réservations",
          icon: Shield,
        },
      ],
    },
    {
      key: "compte",
      label: "Compte",
      items: [
        {
          href: "/dashboard/vendeur/profil",
          label: "Mon profil",
          icon: User,
        },
      ],
    },
  ]
}

export function getDashboardNavSections(role: DashboardRole): DashboardNavSection[] {
  if (role === "vendor") {
    return getVendorNavSections()
  }
  return getClientNavSections()
}

/* Compatibilité : liste plate conservée pour les appelants existants */
export function getClientNavItems(): DashboardNavItem[] {
  return getClientNavSections().flatMap((s) => s.items)
}

export function getVendorNavItems(): DashboardNavItem[] {
  return getVendorNavSections().flatMap((s) => s.items)
}

export function getDashboardNavItems(role: DashboardRole): DashboardNavItem[] {
  return getDashboardNavSections(role).flatMap((s) => s.items)
}
