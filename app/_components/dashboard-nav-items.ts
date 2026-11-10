import {
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  User,
  MapPin,
  Cylinder,
  Shield,
  Megaphone,
  Settings,
  Users,
  Store,
  BarChart3,
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

export type DashboardRole = "client" | "vendor" | "admin" | "collaborateur"

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

export function getAdminDashboardNavSections(
  role: "admin" | "collaborateur",
  permissions: string[]
): DashboardNavSection[] {
  const sections: DashboardNavSection[] = []

  // --- Navigation principale ---
  const principal: DashboardNavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/", label: "Retour au site", icon: ArrowLeft },
  ]

  // --- Gestion du réseau ---
  const gestion: DashboardNavItem[] = []
  const access = (module: string, adminOnly = false) =>
    role === "admin" || (!adminOnly && permissions.includes(module))

  if (access("utilisateurs")) {
    gestion.push({ href: "/admin/users", label: "Utilisateurs", icon: Users })
  }
  if (access("vendeurs")) {
    gestion.push({ href: "/admin/vendeurs", label: "Vendeurs", icon: Store })
    gestion.push({
      href: "/admin/points-de-vente",
      label: "Points de vente",
      icon: Store,
    })
  }
  if (role === "admin") {
    gestion.push({
      href: "/admin/collaborateurs",
      label: "Collaborateurs",
      icon: Shield,
    })
  }
  if (access("disponibilites")) {
    gestion.push({
      href: "/admin/disponibilites",
      label: "Disponibilités",
      icon: Cylinder,
    })
  }

  // --- Marketing & communication ---
  const marketing: DashboardNavItem[] = []
  if (access("marketing")) {
    marketing.push({
      href: "/admin/marketing",
      label: "Publicités",
      icon: Megaphone,
    })
  }
  if (access("avis")) {
    marketing.push({
      href: "/admin/avis",
      label: "Avis & témoignages",
      icon: MessageSquare,
    })
  }

  // --- Analyse ---
  const analyse: DashboardNavItem[] = []
  if (access("statistiques")) {
    analyse.push({
      href: "/admin/statistiques",
      label: "Analyse des données",
      icon: BarChart3,
    })
  }

  // --- Compte & paramètres ---
  const compte: DashboardNavItem[] = [
    { href: "/admin/profil", label: "Mon profil", icon: User },
    { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  ]

  if (principal.length > 0) {
    sections.push({ key: "principal", label: "Navigation", items: principal })
  }
  if (gestion.length > 0) {
    sections.push({ key: "gestion", label: "Gestion du réseau", items: gestion })
  }
  if (marketing.length > 0) {
    sections.push({ key: "marketing", label: "Marketing & communication", items: marketing })
  }
  if (analyse.length > 0) {
    sections.push({ key: "analyse", label: "Analyse", items: analyse })
  }
  sections.push({ key: "compte", label: "Compte & paramètres", items: compte })

  return sections
}

export function getDashboardNavSections(
  role: DashboardRole,
  permissions?: string[]
): DashboardNavSection[] {
  if (role === "vendor") {
    return getVendorNavSections()
  }
  if (role === "admin" || role === "collaborateur") {
    return getAdminDashboardNavSections(role, permissions ?? [])
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

export function getDashboardNavItems(
  role: DashboardRole,
  permissions?: string[]
): DashboardNavItem[] {
  return getDashboardNavSections(role, permissions).flatMap((s) => s.items)
}
