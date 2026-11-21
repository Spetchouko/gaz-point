import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
  collaborateurPermission,
  session as sessionTable,
  user,
} from "@/db/schema"
import { auth } from "@/lib/auth"
import {
  evaluateAccountAccess,
  getRoleDashboardPath,
  isAuthRole,
} from "@/lib/auth-routing"

/**
 * next/headers et next/navigation sont des API Server Components.
 * Elles sont importées de façon dynamique à l'intérieur des fonctions qui en
 * ont besoin afin que ce module reste importable depuis des composants client
 * (ex. le layout collaborateur) sans bloquer le build Turbopack.
 */
async function getHeaders() {
  const { headers } = await import("next/headers")
  return headers()
}

async function getRedirect() {
  const { redirect } = await import("next/navigation")
  return redirect
}

export type ProRole = "vendor" | "admin" | "collaborateur"

export type SessionUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role?: string | null
  phoneNumber?: string | null
  phoneVerified?: boolean | null
  phoneNumberVerified?: boolean | null
  isActive?: boolean | null
  mustChangePassword?: boolean | null
  approvalStatus?: string
  approvalRequestedAt?: Date | null
  approvalProcessedAt?: Date | null
  approvalProcessedBy?: string | null
  rejectionReason?: string | null
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await getHeaders() })
    const userId = session?.user?.id
    if (!userId) return null

    const [account] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        phoneNumberVerified: user.phoneNumberVerified,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        approvalStatus: user.approvalStatus,
        approvalRequestedAt: user.approvalRequestedAt,
        approvalProcessedAt: user.approvalProcessedAt,
        approvalProcessedBy: user.approvalProcessedBy,
        rejectionReason: user.rejectionReason,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    const access = evaluateAccountAccess(account)
    if (!account || access.status !== "ready" || !access.role) return null

    return {
      ...account,
      role: access.role,
    }
  } catch {
    return null
  }
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId))
}

/**
 * Vérifie si un collaborateur doit changer son mot de passe temporaire.
 * Redirige uniquement les collaborateurs (role === 'collaborateur') qui ont
 * mustChangePassword = true vers la page obligatoire de changement de mot de passe.
 * Les comptes administrateurs, vendeurs et clients ne sont jamais impactés.
 */
export async function requirePasswordChangeIfNeeded(user: SessionUser): Promise<void> {
  if (user.role === "collaborateur" && user.mustChangePassword === true) {
    const redirect = await getRedirect()
    redirect("/mot-de-passe-temporaire")
  }
}

/**
 * Variantes pour les Route Handlers : ne redirigent jamais (un redirect()
 * lève NEXT_REDIRECT et serait avalé par le try/catch du handler '500).
 * Retournent null si l'utilisateur n'est pas authentifié / n'a pas le rôle.
 */
export async function getProUser(): Promise<{ user: SessionUser; role: ProRole } | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const role = user.role ?? "client"
  if (role !== "vendor" && role !== "admin" && role !== "collaborateur") return null
  if (role === "collaborateur" && user.mustChangePassword === true) return null
  return { user, role: role as ProRole }
}

export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role !== "admin") return null
  return user
}

/**
 * Variantes pour les Route Handlers : ne redirigent jamais (un redirect()
 * lève NEXT_REDIRECT et serait avalé par le try/catch du handler '500).
 * Retournent null si l'utilisateur n'est pas authentifié / n'a pas le rôle.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    const redirect = await getRedirect()
    return redirect("/connexion")
  }
  // Seul un collaborateur avec mot de passe temporaire est redirigé.
  // Les admins, vendeurs et clients ne sont jamais impactés.
  await requirePasswordChangeIfNeeded(user)
  return user
}

export async function requireVendor() {
  const user = await requireUser()
  if (user.role !== "vendor") {
    const redirect = await getRedirect()
    redirect(
      isAuthRole(user.role)
        ? getRoleDashboardPath(user.role)
        : "/connexion"
    )
  }
  return user
}

export async function requirePro() {
  const user = await requireUser()
  const role = user.role ?? "client"
  if (role !== "vendor" && role !== "admin" && role !== "collaborateur") {
    const redirect = await getRedirect()
    redirect("/dashboard/client")
  }
  return { user, role: role as ProRole }
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== "admin") {
    const redirect = await getRedirect()
    redirect(
      isAuthRole(user.role)
        ? getRoleDashboardPath(user.role)
        : "/connexion"
    )
  }
  return user
}

export async function requireCollaborator() {
  const user = await requireUser()
  if (user.role !== "collaborateur" && user.role !== "admin") {
    const redirect = await getRedirect()
    redirect(
      isAuthRole(user.role)
        ? getRoleDashboardPath(user.role)
        : "/connexion"
    )
  }
  return user
}

export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaff()
  return staff
}

export async function getStaff(): Promise<StaffUser> {
  const user = await getCurrentUser()
  if (!user) {
    const redirect = await getRedirect()
    return redirect("/connexion-admin")
  }
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") {
    const redirect = await getRedirect()
    redirect(
      isAuthRole(role)
        ? getRoleDashboardPath(role)
        : "/connexion"
    )
  }
  await requirePasswordChangeIfNeeded(user)
  const permissions =
    role === "admin"
      ? new Set<AdminModule>(ADMIN_MODULES)
      : await getAdminPermissions(user.id)
  return { user, role: role as "admin" | "collaborateur", permissions }
}

export type StaffUser = {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
  role: "admin" | "collaborateur"
  permissions: Set<AdminModule>
}

export type AdminModule =
  | "utilisateurs"
  | "clients"
  | "vendeurs"
  | "disponibilites"
  | "reservations"
  | "publicite"
  | "collaborateurs"
  | "marketing"
  | "avis"
  | "statistiques"
  | "abonnements"

export const ADMIN_MODULES: AdminModule[] = [
  "utilisateurs",
  "clients",
  "vendeurs",
  "disponibilites",
  "reservations",
  "publicite",
  "collaborateurs",
  "marketing",
  "avis",
  "statistiques",
  "abonnements",
] as const

export async function getAdminPermissions(userId: string): Promise<Set<AdminModule>> {
  const rows = await db
    .select({ module: collaborateurPermission.module })
    .from(collaborateurPermission)
    .where(eq(collaborateurPermission.collaboratorId, userId))
  return new Set(rows.map((r) => r.module as AdminModule))
}

export async function requireStaffModule(module: AdminModule): Promise<StaffUser> {
  const staff = await getStaff()
  if (staff.role !== "admin" && !staff.permissions.has(module)) {
    const redirect = await getRedirect()
    redirect("/dashboard/admin")
  }
  return staff
}

export function canAccessModule(
  staff: Pick<StaffUser, "role" | "permissions">,
  module: AdminModule
): boolean {
  return staff.role === "admin" || staff.permissions.has(module)
}

export interface AdminNavItem {
  href: string
  label: string
  icon: string
  module: AdminModule
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/dashboard/admin", label: "Vue d'ensemble", icon: "LayoutDashboard", module: "statistiques" },
  { href: "/dashboard/admin/utilisateurs", label: "Gestion des utilisateurs", icon: "Users", module: "utilisateurs" },
  { href: "/dashboard/admin/vendeurs", label: "Gestion des vendeurs", icon: "Store", module: "vendeurs" },
  { href: "/dashboard/admin/reservations", label: "Gestion des réservations", icon: "Calendar", module: "reservations" },
  { href: "/dashboard/admin/disponibilites", label: "Disponibilités", icon: "Package", module: "disponibilites" },
  { href: "/dashboard/admin/publicite", label: "Annonces & publicités", icon: "Truck", module: "publicite" },
  { href: "/dashboard/admin/points-de-vente", label: "Points de vente", icon: "Package", module: "vendeurs" },
  { href: "/dashboard/admin/analytics", label: "Rapports & stats", icon: "BarChart3", module: "statistiques" },
  { href: "/dashboard/admin/collaborateurs", label: "Collaborateurs & permissions", icon: "ShieldUser", module: "collaborateurs" },
  { href: "/dashboard/admin/profil", label: "Mon profil", icon: "User", module: "statistiques" },
] as const

export async function isPrincipalAdmin(userId: string): Promise<boolean> {
  const [first] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "admin"))
    .orderBy(user.createdAt)
    .limit(1)
  return Boolean(first && first.id === userId)
}

export async function canModifyUserRole(
  actor: Pick<SessionUser, "id" | "role">,
  target: Pick<SessionUser, "id" | "role">,
  desiredRole?: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (desiredRole !== undefined && !isAuthRole(desiredRole)) {
    return { allowed: false, reason: "Le rôle demandé n'est pas valide." }
  }

  if (actor.role !== "admin") {
    if (target.role === "admin") {
      return {
        allowed: false,
        reason: "Un collaborateur ne peut pas modifier un compte administrateur.",
      }
    }
    if (
      desiredRole !== undefined &&
      desiredRole !== target.role &&
      (desiredRole === "admin" || desiredRole === "collaborateur")
    ) {
      return {
        allowed: false,
        reason:
          "Un collaborateur ne peut pas attribuer un rôle administrateur ou collaborateur.",
      }
    }
  }

  if (
    target.role === "admin" &&
    desiredRole !== undefined &&
    desiredRole !== "admin" &&
    (await isPrincipalAdmin(target.id))
  ) {
    return {
      allowed: false,
      reason: "L'administrateur principal ne peut pas être rétrogradé.",
    }
  }

  return { allowed: true }
}

export async function requireModule(module: AdminModule): Promise<StaffUser> {
  const staff = await getStaff()
  if (!canAccessModule(staff, module)) {
    const redirect = await getRedirect()
    redirect("/dashboard/admin")
  }
  return staff
}

/**
 * API-compatible versions that return null instead of redirecting.
 * Use these in Route Handlers (API routes).
 */

export async function getStaffApi(): Promise<StaffUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") return null
  if (role === "collaborateur" && user.mustChangePassword === true) return null
  const permissions =
    role === "admin"
      ? new Set<AdminModule>(ADMIN_MODULES)
      : await getAdminPermissions(user.id)
  return { user, role: role as "admin" | "collaborateur", permissions }
}

export async function requireStaffApi(): Promise<StaffUser | null> {
  return getStaffApi()
}

export async function requireModuleApi(module: AdminModule): Promise<StaffUser | null> {
  const staff = await getStaffApi()
  if (!staff || !canAccessModule(staff, module)) {
    return null
  }
  return staff
}

export async function requireAdminApi(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role !== "admin") return null
  return user
}

export async function requireCollaboratorApi(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const role = user.role ?? "client"
  if (role !== "collaborateur" && role !== "admin") return null
  if (role === "collaborateur" && user.mustChangePassword === true) return null
  return user
}
