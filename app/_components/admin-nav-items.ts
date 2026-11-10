import {
  Activity,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Cylinder,
  Settings,
  Store,
  User,
  Users,
  Shield,
  BarChart3,
  Clock,
  Mail,
  Calendar,
} from "lucide-react"
import type { ComponentType } from "react"

export type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** Sous-items optionnels (menu dépliable, style Outlook) */
  subItems?: NavItem[]
}

export type NavSection = {
  key: string
  label: string
  items: NavItem[]
}

export type StaffNavRole = "admin" | "collaborateur"

const access = (
  role: StaffNavRole,
  permissions: string[],
  module: string,
  adminOnly = false
) =>
  role === "admin" || (!adminOnly && permissions.includes(module))

export function getAdminNavSections(
  role: StaffNavRole,
  permissions: string[]
): NavSection[] {
  const sections: NavSection[] = []

  // --- Navigation principale ---
  const principal: NavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  ]

  // --- Gestion du réseau ---
  const gestion: NavItem[] = []
  if (access(role, permissions, "utilisateurs")) {
    gestion.push({ href: "/admin/users", label: "Utilisateurs", icon: Users })
  }
  if (access(role, permissions, "vendeurs")) {
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
  if (access(role, permissions, "disponibilites")) {
    gestion.push({
      href: "/admin/disponibilites",
      label: "Disponibilités",
      icon: Cylinder,
    })
  }

  // --- Marketing & communication ---
  const marketing: NavItem[] = []
  if (access(role, permissions, "marketing")) {
    marketing.push({
      href: "/admin/marketing",
      label: "Publicités",
      icon: Megaphone,
    })
  }
  if (access(role, permissions, "avis")) {
    marketing.push({
      href: "/admin/avis",
      label: "Avis & témoignages",
      icon: MessageSquare,
    })
  }

  // --- Analyse ---
  const analyse: NavItem[] = []
  if (access(role, permissions, "statistiques")) {
    analyse.push({
      href: "/admin/statistiques",
      label: "Analyse des données",
      icon: BarChart3,
    })
  }

  // --- Compte & paramètres ---
  const compte: NavItem[] = [
    { href: "/admin/profil", label: "Mon profil", icon: User },
    { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  ]

  if (principal.length > 0) {
    sections.push({ key: "principal", label: "Navigation", items: principal })
  }
  if (gestion.length > 0) {
    sections.push({
      key: "gestion",
      label: "Gestion du réseau",
      items: gestion,
    })
  }
  if (marketing.length > 0) {
    sections.push({
      key: "marketing",
      label: "Marketing & communication",
      items: marketing,
    })
  }
  if (analyse.length > 0) {
    sections.push({ key: "analyse", label: "Analyse", items: analyse })
  }
  sections.push({ key: "compte", label: "Compte & paramètres", items: compte })

  return sections
}

/* Compatibilité : liste plate conservée pour la barre supérieure mobile */
export function getAdminNavItems(
  role: StaffNavRole,
  permissions: string[]
): NavItem[] {
  return getAdminNavSections(role, permissions).flatMap((s) => s.items)
}
