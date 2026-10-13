import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { collaborateurPermission } from "@/db/schema"
import { auth } from "@/lib/auth"

export type ProRole = "vendor" | "admin" | "collaborateur"

export const ADMIN_MODULES = [
  "utilisateurs",
  "vendeurs",
  "disponibilites",
  "marketing",
  "avis",
  "statistiques",
] as const
export type AdminModule = (typeof ADMIN_MODULES)[number]

export type SessionUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role?: string | null
  phoneNumber?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user
  return (user as SessionUser | undefined) ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/connexion")
  return user
}

export async function requirePro() {
  const user = await requireUser()
  const role = user.role ?? "client"
  if (role !== "vendor" && role !== "admin" && role !== "collaborateur") redirect("/dashboard")
  return { user, role: role as ProRole }
}

export async function requireAdmin() {
  const user = await requireUser()
  const role = user.role ?? "client"
  if (role !== "admin") redirect("/dashboard")
  return user
}

export async function requireCollaborator() {
  const user = await requireUser()
  const role = user.role ?? "client"
  if (role !== "collaborateur" && role !== "admin") redirect("/dashboard")
  return user
}

export async function getAdminPermissions(userId: string): Promise<Set<AdminModule>> {
  const rows = await db
    .select({ module: collaborateurPermission.module })
    .from(collaborateurPermission)
    .where(eq(collaborateurPermission.collaboratorId, userId))
  return new Set(rows.map((r) => r.module as AdminModule))
}

export type StaffUser = {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
  role: "admin" | "collaborateur"
  permissions: Set<AdminModule>
}

export async function getStaff(): Promise<StaffUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/admin/login")
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") redirect("/admin/login")
  const permissions =
    role === "admin"
      ? new Set<AdminModule>(ADMIN_MODULES)
      : await getAdminPermissions(user.id)
  return { user, role, permissions }
}

export async function requireStaffModule(module: AdminModule): Promise<StaffUser> {
  const staff = await getStaff()
  if (staff.role !== "admin" && !staff.permissions.has(module)) {
    redirect("/admin")
  }
  return staff
}

export function canAccessModule(
  staff: Pick<StaffUser, "role" | "permissions">,
  module: AdminModule
): boolean {
  return staff.role === "admin" || staff.permissions.has(module)
}
