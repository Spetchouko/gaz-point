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
  Users,
  Shield,
  BarChart3,
  MapPin,
  Archive,
  CreditCard,
  type LucideIcon,
} from "lucide-react"

export type DashboardShellRole = "client" | "vendor" | "admin" | "collaborateur"

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export type DashboardNavGroup = {
  groupLabel: string
  items: Array<{
    key: string
    href: string
    label: string
    icon: LucideIcon
    requiredPermission?: string | null
  }>
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
    href: "/dashboard/vendeur/historique",
    label: "Historique",
    icon: History,
  },
  {
    href: "/dashboard/vendeur/notifications",
    label: "Notifications",
    icon: Bell,
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
  {
    href: "/dashboard/vendeur/parametres",
    label: "Paramètres",
    icon: Settings,
  },
]

export const ADMIN_NAV_GROUPS: DashboardNavGroup[] = [
  {
    groupLabel: "TABLEAU DE BORD",
    items: [
      {
        key: "overview",
        href: "/dashboard/admin",
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
        requiredPermission: null,
      },
      {
        key: "analytics",
        href: "/dashboard/admin/analytics",
        label: "Rapports & Statistiques",
        icon: BarChart3,
        requiredPermission: "statistiques",
      },
    ],
  },
  {
    groupLabel: "GESTION DES UTILISATEURS",
    items: [
      {
        key: "utilisateurs",
        href: "/dashboard/admin/utilisateurs",
        label: "Utilisateurs",
        icon: Users,
        requiredPermission: "utilisateurs",
      },
      {
        key: "vendeurs",
        href: "/dashboard/admin/vendeurs",
        label: "Vendeurs",
        icon: Store,
        requiredPermission: "vendeurs",
      },
      {
        key: "collaborateurs",
        href: "/dashboard/admin/collaborateurs",
        label: "Collaborateurs",
        icon: Shield,
        requiredPermission: "collaborateurs",
      },
    ],
  },
  {
    groupLabel: "GESTION DES OPÉRATIONS",
    items: [
      {
        key: "points-de-vente",
        href: "/dashboard/admin/points-de-vente",
        label: "Points de vente",
        icon: MapPin,
        requiredPermission: "vendeurs",
      },
      {
        key: "disponibilites",
        href: "/dashboard/admin/disponibilites",
        label: "Disponibilités",
        icon: Package,
        requiredPermission: "disponibilites",
      },
      {
        key: "reservations",
        href: "/dashboard/admin/reservations",
        label: "Réservations",
        icon: Calendar,
        requiredPermission: "reservations",
      },
    ],
  },
  {
    groupLabel: "CONTENU & MARKETING",
    items: [
      {
        key: "publicite",
        href: "/dashboard/admin/publicite",
        label: "Annonces & Publicités",
        icon: Truck,
        requiredPermission: "publicite",
      },
    ],
  },
  {
    groupLabel: "AVIS & RÉPUTATION",
    items: [
      {
        key: "avis",
        href: "/dashboard/admin/avis",
        label: "Gestion des avis",
        icon: MessageSquare,
        requiredPermission: "avis",
      },
    ],
  },
  {
    groupLabel: "ABONNEMENTS",
    items: [
      {
        key: "abonnements",
        href: "/dashboard/admin/abonnements",
        label: "Abonnements",
        icon: CreditCard,
        requiredPermission: "abonnements",
      },
    ],
  },
]

export const COLLABORATEUR_NAV_GROUPS: DashboardNavGroup[] = [
  {
    groupLabel: "TABLEAU DE BORD",
    items: [
      {
        key: "overview",
        href: "/dashboard/collaborateur",
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
        requiredPermission: null,
      },
    ],
  },
  {
    groupLabel: "GESTION DES UTILISATEURS",
    items: [
      {
        key: "utilisateurs",
        href: "/dashboard/admin/utilisateurs",
        label: "Gestion des utilisateurs",
        icon: Users,
        requiredPermission: "utilisateurs",
      },
      {
        key: "clients",
        href: "/dashboard/admin/utilisateurs?role=client",
        label: "Clients",
        icon: Users,
        requiredPermission: "utilisateurs",
      },
      {
        key: "vendeurs",
        href: "/dashboard/admin/vendeurs",
        label: "Gestion des vendeurs",
        icon: Store,
        requiredPermission: "vendeurs",
      },
    ],
  },
  {
    groupLabel: "GESTION DES OPÉRATIONS",
    items: [
      {
        key: "disponibilites",
        href: "/dashboard/admin/disponibilites",
        label: "Disponibilités",
        icon: Package,
        requiredPermission: "disponibilites",
      },
      {
        key: "reservations",
        href: "/dashboard/admin/reservations",
        label: "Gestion des réservations",
        icon: Calendar,
        requiredPermission: "reservations",
      },
    ],
  },
  {
    groupLabel: "CONTENU & MARKETING",
    items: [
      {
        key: "publicite",
        href: "/dashboard/admin/publicite",
        label: "Annonces & publicités",
        icon: Truck,
        requiredPermission: "publicite",
      },
    ],
  },
  {
    groupLabel: "ADMINISTRATION",
    items: [
      {
        key: "collaborateurs",
        href: "/dashboard/admin/collaborateurs",
        label: "Gestion des collaborateurs",
        icon: Shield,
        requiredPermission: "collaborateurs",
      },
      {
        key: "marketing",
        href: "/dashboard/admin/analytics",
        label: "Marketing",
        icon: BarChart3,
        requiredPermission: "statistiques",
      },
      {
        key: "avis",
        href: "/dashboard/admin/utilisateurs?type=avis",
        label: "Avis",
        icon: MessageSquare,
        requiredPermission: "avis",
      },
      {
        key: "statistiques",
        href: "/dashboard/admin/analytics",
        label: "Statistiques",
        icon: BarChart3,
        requiredPermission: "statistiques",
      },
    ],
  },
]

export function getDashboardNavItems(role: DashboardShellRole): DashboardNavItem[] {
  switch (role) {
    case "vendor":
      return VENDOR_NAV_ITEMS
    case "admin":
    case "collaborateur":
      // Admin and collaborateur use grouped navigation, but we provide a flat fallback
      return []
    default:
      return CLIENT_NAV_ITEMS
  }
}

export function getDashboardNavGroups(role: DashboardShellRole): DashboardNavGroup[] | null {
  switch (role) {
    case "admin":
      return ADMIN_NAV_GROUPS
    case "collaborateur":
      return COLLABORATEUR_NAV_GROUPS
    default:
      return null
  }
}

export function getDashboardHomeHref(role: DashboardShellRole): string {
  switch (role) {
    case "vendor":
      return "/dashboard/vendeur"
    case "admin":
      return "/dashboard/admin"
    case "collaborateur":
      return "/dashboard/collaborateur"
    default:
      return "/dashboard/client"
  }
}

export function getDashboardProfileHref(role: DashboardShellRole): string {
  switch (role) {
    case "vendor":
      return "/dashboard/vendeur/profil"
    case "admin":
    case "collaborateur":
      return "/dashboard/admin/profil"
    default:
      return "/dashboard/profil"
  }
}

export function getDashboardNotificationsHref(role: DashboardShellRole): string {
  switch (role) {
    case "vendor":
      return "/dashboard/vendeur/notifications"
    case "admin":
    case "collaborateur":
      return "/dashboard/admin/notifications"
    default:
      return "/dashboard/notifications"
  }
}

export function getPrimaryAction(role: DashboardShellRole) {
  switch (role) {
    case "vendor":
      return {
        label: "Disponibilités",
        href: "/dashboard/depot/disponibilites",
        icon: Package,
        ariaLabel: "Voir mes disponibilités",
      }
    case "admin":
      return {
        label: "Tableau de bord",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
        ariaLabel: "Tableau de bord",
      }
    case "collaborateur":
      return {
        label: "Tableau de bord",
        href: "/dashboard/collaborateur",
        icon: LayoutDashboard,
        ariaLabel: "Tableau de bord",
      }
    default:
      return {
        label: "Recherche",
        href: "/resultats-recherche",
        icon: Search,
        ariaLabel: "Nouvelle recherche",
      }
  }
}

export function getSecondaryAction(role: DashboardShellRole) {
  switch (role) {
    case "vendor":
      return {
        label: "Réservations",
        href: "/dashboard/depot/reservations",
        icon: Calendar,
        ariaLabel: "Voir mes réservations",
      }
    case "admin":
      return {
        label: "Rapports",
        href: "/dashboard/admin/analytics",
        icon: BarChart3,
        ariaLabel: "Rapports et statistiques",
      }
    case "collaborateur":
      return null
    default:
      return {
        label: "Réservations",
        href: "/dashboard/reservations",
        icon: Calendar,
        ariaLabel: "Mes réservations",
      }
  }
}