import {
  LayoutDashboard,
  Calendar,
  Heart,
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
}

export type DashboardNavSection = {
  key: string
  label: string
  items: DashboardNavItem[]
}

export type DashboardRole = "client" | "vendor"

export function getClientNavItems(): DashboardNavItem[] {
  return [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/reservations", label: "Mes réservations", icon: Calendar },
    { href: "/dashboard/favoris", label: "Mes favoris", icon: Heart },
    { href: "/dashboard/historique-codes", label: "Historique des codes", icon: FileText },
    { href: "/avis", label: "Donner mon avis", icon: MessageSquare },
    { href: "/profil", label: "Mon profil", icon: User },
  ]
}

export function getVendorNavItems(): DashboardNavItem[] {
  return [
    { href: "/dashboard/vendeur", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/vendeur/points-de-vente", label: "Mon point de vente", icon: MapPin },
    { href: "/dashboard/vendeur/disponibilites", label: "Disponibilités de gaz", icon: Cylinder },
    { href: "/dashboard/vendeur/consignations", label: "Mes consignations", icon: Shield },
    { href: "/dashboard/vendeur/profil", label: "Mon profil", icon: User },
  ]
}

export function getDashboardNavItems(role: DashboardRole): DashboardNavItem[] {
  if (role === "vendor") {
    return getVendorNavItems()
  }
  return getClientNavItems()
}
