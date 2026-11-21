import {
  Calendar,
  History,
  Home,
  LayoutDashboard,
  MessageSquare,
  Package,
  Search,
  Settings,
  Store,
  Truck,
  User,
  Bell,
  type LucideIcon,
} from "lucide-react"

export type DashboardShellRole = "client" | "vendor"

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const CLIENT_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard/client",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/profil",
    label: "Mon profil",
    icon: User,
  },
  {
    href: "/dashboard/recherches",
    label: "Mes recherches",
    icon: Search,
  },
  {
    href: "/dashboard/reservations",
    label: "Mes réservations",
    icon: Calendar,
  },
  {
    href: "/dashboard/historique",
    label: "Historique",
    icon: History,
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    href: "/dashboard/avis",
    label: "Donner mon avis",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/parametres",
    label: "Paramètres",
    icon: Settings,
  },
  {
    href: "/",
    label: "Retour à l'accueil",
    icon: Home,
  },
]

export const VENDOR_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard/vendeur",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/depot",
    label: "Mes points de vente",
    icon: Store,
  },
  {
    href: "/dashboard/depot/disponibilites",
    label: "Mes disponibilités",
    icon: Package,
  },
  {
    href: "/dashboard/depot/reservations",
    label: "Mes réservations",
    icon: Calendar,
  },
  {
    href: "/dashboard/depot/services",
    label: "Mes services",
    icon: Truck,
  },
  {
    href: "/dashboard/avis",
    label: "Donner mon avis",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/vendeur/profil",
    label: "Mon profil",
    icon: User,
  },
]

export function getDashboardNavItems(role: DashboardShellRole): DashboardNavItem[] {
  return role === "vendor" ? VENDOR_NAV_ITEMS : CLIENT_NAV_ITEMS
}

export function getDashboardHomeHref(role: DashboardShellRole): string {
  return role === "vendor" ? "/dashboard/vendeur" : "/dashboard/client"
}

export function getDashboardProfileHref(role: DashboardShellRole): string {
  return role === "vendor" ? "/dashboard/vendeur/profil" : "/dashboard/profil"
}
