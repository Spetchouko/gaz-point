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
} from "lucide-react"
import type { ComponentType } from "react"

export type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type StaffNavRole = "admin" | "collaborateur"

export function getAdminNavItems(
  role: StaffNavRole,
  permissions: string[]
): NavItem[] {
  const access = (module: string, adminOnly = false) =>
    role === "admin" || (!adminOnly && permissions.includes(module))

  const items: NavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  ]
  if (access("utilisateurs")) {
    items.push({ href: "/admin/users", label: "Utilisateurs", icon: Users })
  }
  if (access("vendeurs")) {
    items.push({ href: "/admin/vendeurs", label: "Vendeurs", icon: Store })
    items.push({ href: "/admin/points-de-vente", label: "Points de vente", icon: Store })
  }
  if (role === "admin") {
    items.push({
      href: "/admin/collaborateurs",
      label: "Collaborateurs",
      icon: User,
    })
  }
  if (access("disponibilites")) {
    items.push({ href: "/admin/disponibilites", label: "Disponibilités", icon: Cylinder })
  }
  if (access("marketing")) {
    items.push({ href: "/admin/marketing", label: "Marketing & Publicités", icon: Megaphone })
  }
  if (access("avis")) {
    items.push({ href: "/admin/avis", label: "Avis & Témoignages", icon: MessageSquare })
  }
  if (access("statistiques")) {
    items.push({ href: "/admin/statistiques", label: "Statistiques", icon: Activity })
  }
  items.push({ href: "/admin/profil", label: "Mon profil", icon: User })
  items.push({ href: "/admin/parametres", label: "Paramètres", icon: Settings })

  return items
}