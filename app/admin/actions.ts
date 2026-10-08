"use server"

import { randomUUID } from "node:crypto"
import { eq, desc, ilike, or, and, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import {
  user as userTable,
  pointDeVente,
  disponibilite,
  type AvailabilityStatus,
  type AvailabilitySource,
} from "@/db/schema"
import { requireAdmin } from "@/lib/session"
import { auth } from "@/lib/auth"

export type ActionResult = { ok: boolean; message: string }

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function generateCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsv).join(",")
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","))
  return [headerLine, ...dataLines].join("\n")
}

export async function exportUsersCsv(): Promise<{ ok: boolean; csv?: string; message: string }> {
  await requireAdmin()

  const users = await db
    .select()
    .from(userTable)
    .orderBy(desc(userTable.createdAt))

  const headers = ["ID", "Nom", "Email", "Téléphone", "Rôle", "Email vérifié", "Téléphone vérifié", "Date d'inscription", "Dernière modification"]
  const rows = users.map((u) => [
    u.id,
    u.name,
    u.email,
    u.phoneNumber ?? "",
    u.role,
    u.emailVerified ? "Oui" : "Non",
    u.phoneVerified ? "Oui" : "Non",
    u.createdAt.toISOString().split("T")[0],
    u.updatedAt.toISOString().split("T")[0],
  ])

  const csv = generateCsv(headers, rows)
  return { ok: true, csv, message: "Export utilisateurs généré." }
}

export async function exportVendorsCsv(): Promise<{ ok: boolean; csv?: string; message: string }> {
  await requireAdmin()

  const vendors = await db
    .select()
    .from(userTable)
    .where(eq(userTable.role, "vendor"))
    .orderBy(desc(userTable.createdAt))

  const vendorIds = vendors.map((v) => v.id)

  let pointsMap = new Map<string, typeof pointDeVente.$inferSelect[]>()
  let dispoMap = new Map<string, typeof disponibilite.$inferSelect[]>()

  if (vendorIds.length > 0) {
    const points = await db
      .select()
      .from(pointDeVente)
      .where(inArray(pointDeVente.vendorId, vendorIds))
    for (const p of points) {
      if (p.vendorId) {
        const existing = pointsMap.get(p.vendorId) ?? []
        existing.push(p)
        pointsMap.set(p.vendorId, existing)
      }
    }

    const pointIds = points.map((p) => p.id)
    if (pointIds.length > 0) {
      const dispos = await db
        .select()
        .from(disponibilite)
        .where(inArray(disponibilite.pointId, pointIds))
      for (const d of dispos) {
        const point = points.find((p) => p.id === d.pointId)
        if (point?.vendorId) {
          const existing = dispoMap.get(point.vendorId) ?? []
          existing.push(d)
          dispoMap.set(point.vendorId, existing)
        }
      }
    }
  }

  const headers = [
    "ID",
    "Nom",
    "Email",
    "Téléphone",
    "Boutique/Point de vente",
    "Quartier",
    "Adresse",
    "Téléphone boutique",
    "Nombre de dépôts",
    "Disponibilités totales",
    "Disponibilités actives",
    "Bouteilles totales",
    "Statut",
    "Date d'inscription",
  ]

  const rows = vendors.map((v) => {
    const points = pointsMap.get(v.id) ?? []
    const dispos = dispoMap.get(v.id) ?? []
    const activeDispos = dispos.filter((d) => d.status === "disponible" && (d.quantity ?? 0) > 0)
    const totalQty = dispos.reduce((sum, d) => sum + (d.quantity ?? 0), 0)
    const mainPoint = points[0]

    return [
      v.id,
      v.name,
      v.email,
      v.phoneNumber ?? "",
      mainPoint?.name ?? "",
      mainPoint?.district ?? "",
      mainPoint?.address ?? "",
      mainPoint?.phone ?? "",
      points.length.toString(),
      dispos.length.toString(),
      activeDispos.length.toString(),
      totalQty.toString(),
      activeDispos.length > 0 ? "Actif" : "Inactif",
      v.createdAt.toISOString().split("T")[0],
    ]
  })

  const csv = generateCsv(headers, rows)
  return { ok: true, csv, message: "Export vendeurs généré." }
}

export async function exportCollaborateursCsv(): Promise<{ ok: boolean; csv?: string; message: string }> {
  await requireAdmin()

  const collaborateurs = await db
    .select()
    .from(userTable)
    .where(eq(userTable.role, "admin"))
    .orderBy(desc(userTable.createdAt))

  const headers = ["ID", "Nom", "Email", "Téléphone", "Rôle", "Email vérifié", "Téléphone vérifié", "Date d'inscription", "Dernière modification"]
  const rows = collaborateurs.map((u) => [
    u.id,
    u.name,
    u.email,
    u.phoneNumber ?? "",
    u.role,
    u.emailVerified ? "Oui" : "Non",
    u.phoneVerified ? "Oui" : "Non",
    u.createdAt.toISOString().split("T")[0],
    u.updatedAt.toISOString().split("T")[0],
  ])

  const csv = generateCsv(headers, rows)
  return { ok: true, csv, message: "Export collaborateurs généré." }
}

const STATUSES: AvailabilityStatus[] = ["disponible", "a_confirmer", "indisponible"]
const SOURCES: AvailabilitySource[] = ["vendeur", "administration"]

export async function createVendor(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim() || null
  const password = String(formData.get("password") ?? "")
  const pointName = String(formData.get("pointName") ?? "").trim()
  const pointDistrict = String(formData.get("pointDistrict") ?? "").trim()
  const pointAddress = String(formData.get("pointAddress") ?? "").trim()
  const pointPhone = String(formData.get("pointPhone") ?? "").trim() || null

  if (!name) return { ok: false, message: "Le nom est requis." }
  if (!email) return { ok: false, message: "L'email est requis." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format d'email invalide." }
  if (password && password.length < 6) return { ok: false, message: "Le mot de passe doit contenir au moins 6 caractères." }
  if (phoneNumber && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phoneNumber)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }

  const existingUser = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1)
  if (existingUser.length > 0) return { ok: false, message: "Cette adresse email est déjà utilisée." }

  const cleanPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || null
  const userId = randomUUID()

  await db.insert(userTable).values({
    id: userId,
    name,
    email,
    phoneNumber: cleanPhoneNumber,
    role: "vendor",
    emailVerified: false,
    phoneVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  let pointId: string | null = null
  if (pointName && pointDistrict && pointAddress) {
    pointId = randomUUID()
    await db.insert(pointDeVente).values({
      id: pointId,
      name: pointName,
      district: pointDistrict,
      address: pointAddress,
      phone: pointPhone,
      vendorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/admin/points-de-vente")

  return {
    ok: true,
    message: `Vendeur « ${name} » créé avec succès${pointId ? ` et dépôt « ${pointName} » rattaché` : ""}.`,
  }
}

export async function updateVendor(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const userId = String(formData.get("userId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim() || null
  const pointId = String(formData.get("pointId") ?? "")
  const pointName = String(formData.get("pointName") ?? "").trim()
  const pointDistrict = String(formData.get("pointDistrict") ?? "").trim()
  const pointAddress = String(formData.get("pointAddress") ?? "").trim()
  const pointPhone = String(formData.get("pointPhone") ?? "").trim() || null

  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (!name) return { ok: false, message: "Le nom est requis." }
  if (phoneNumber && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phoneNumber)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }

  const cleanPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || null

  await db
    .update(userTable)
    .set({ name, phoneNumber: cleanPhoneNumber, updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  if (pointId) {
    await db
      .update(pointDeVente)
      .set({ name: pointName, district: pointDistrict, address: pointAddress, phone: pointPhone, updatedAt: new Date() })
      .where(eq(pointDeVente.id, pointId))
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/admin/points-de-vente")

  return { ok: true, message: "Vendeur mis à jour avec succès." }
}

export async function toggleVendorStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const userId = String(formData.get("userId") ?? "")
  const currentRole = String(formData.get("currentRole") ?? "")

  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas modifier votre propre rôle." }
  if (currentRole === "admin") return { ok: false, message: "Impossible de modifier le rôle d'un administrateur." }

  const newRole = currentRole === "vendor" ? "client" : "vendor"

  await db
    .update(userTable)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")

  return {
    ok: true,
    message: newRole === "vendor"
      ? "Le compte a été promu au rôle Vendeur."
      : "Le compte a été désactivé (rôle Usager).",
  }
}

export async function createDisponibiliteAdmin(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const pointId = String(formData.get("pointId") ?? "")
  const status = String(formData.get("status") ?? "") as AvailabilityStatus
  const quantityRaw = String(formData.get("quantity") ?? "").trim()
  const format = String(formData.get("format") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const note = String(formData.get("note") ?? "").trim() || null

  if (!pointId) return { ok: false, message: "Point de vente requis." }
  if (!STATUSES.includes(status)) return { ok: false, message: "Statut invalide." }
  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null
  if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) return { ok: false, message: "Quantité invalide." }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }

  const admin = await auth.api.getSession({ headers: await import("next/headers").then((m) => m.headers()) })
  const adminUser = admin?.user

  await db.insert(disponibilite).values({
    id: randomUUID(),
    pointId,
    status,
    quantity,
    format,
    phone,
    note,
    reportedBy: adminUser?.id ?? null,
    reportedByName: adminUser?.name ?? "Administration",
    source: "administration",
    createdAt: new Date(),
  })

  revalidatePath("/admin/disponibilites")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/dashboard/vendeur")
  revalidatePath("/dashboard/pro")

  return { ok: true, message: "Disponibilité créée par l'administration." }
}

export async function updateDisponibiliteAdmin(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const disponibiliteId = String(formData.get("disponibiliteId") ?? "")
  const status = String(formData.get("status") ?? "") as AvailabilityStatus
  const quantityRaw = String(formData.get("quantity") ?? "").trim()
  const format = String(formData.get("format") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const note = String(formData.get("note") ?? "").trim() || null

  if (!disponibiliteId) return { ok: false, message: "Disponibilité introuvable." }
  if (!STATUSES.includes(status)) return { ok: false, message: "Statut invalide." }
  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null
  if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) return { ok: false, message: "Quantité invalide." }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }

  await db
    .update(disponibilite)
    .set({
      status,
      quantity,
      format,
      phone,
      note,
      updatedAt: new Date(),
    })
    .where(eq(disponibilite.id, disponibiliteId))

  revalidatePath("/admin/disponibilites")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/dashboard/vendeur")
  revalidatePath("/dashboard/pro")

  return { ok: true, message: "Disponibilité mise à jour par l'administration." }
}

export async function deleteDisponibiliteAdmin(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const disponibiliteId = String(formData.get("disponibiliteId") ?? "")

  if (!disponibiliteId) return { ok: false, message: "Disponibilité introuvable." }

  await db.delete(disponibilite).where(eq(disponibilite.id, disponibiliteId))

  revalidatePath("/admin/disponibilites")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/dashboard/vendeur")
  revalidatePath("/dashboard/pro")

  return { ok: true, message: "Disponibilité supprimée." }
}

export async function assignVendorToPoint(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const pointId = String(formData.get("pointId") ?? "")
  const vendorId = String(formData.get("vendorId") ?? "")

  if (!pointId) return { ok: false, message: "Point de vente introuvable." }

  let assignedVendor: string | null = null
  if (vendorId && vendorId !== "__none__") {
    const [vendor] = await db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, vendorId))
      .limit(1)
    if (!vendor || vendor.role !== "vendor") return { ok: false, message: "Le vendeur sélectionné est introuvable." }
    assignedVendor = vendor.id
  }

  await db
    .update(pointDeVente)
    .set({ vendorId: assignedVendor, updatedAt: new Date() })
    .where(eq(pointDeVente.id, pointId))

  revalidatePath("/admin/points-de-vente")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/dashboard/vendeur")
  revalidatePath("/dashboard/pro")

  return {
    ok: true,
    message: assignedVendor ? "Vendeur rattaché au dépôt." : "Rattachement du vendeur retiré.",
  }
}

export type AdminRole = "super_admin" | "admin" | "moderator"

export async function createAdminCollaborator(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim() || null
  const password = String(formData.get("password") ?? "")
  const adminRole = String(formData.get("adminRole") ?? "admin") as AdminRole

  if (!name) return { ok: false, message: "Le nom est requis." }
  if (!email) return { ok: false, message: "L'email est requis." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format d'email invalide." }
  if (!password || password.length < 8) return { ok: false, message: "Le mot de passe doit contenir au moins 8 caractères." }
  if (phoneNumber && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phoneNumber)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }
  if (!["super_admin", "admin", "moderator"].includes(adminRole)) {
    return { ok: false, message: "Rôle administrateur invalide." }
  }

  const existingUser = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.email, email)).limit(1)
  if (existingUser.length > 0) return { ok: false, message: "Cette adresse email est déjà utilisée." }

  const cleanPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || null
  const userId = randomUUID()

  await db.insert(userTable).values({
    id: userId,
    name,
    email,
    phoneNumber: cleanPhoneNumber,
    role: "admin",
    emailVerified: true,
    phoneVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath("/admin/collaborateurs")

  return {
    ok: true,
    message: `Collaborateur administrateur « ${name} » créé avec succès (rôle: ${adminRole}).`,
  }
}

export async function updateAdminCollaborator(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const userId = String(formData.get("userId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim() || null
  const adminRole = String(formData.get("adminRole") ?? "admin") as AdminRole

  if (!userId) return { ok: false, message: "Collaborateur introuvable." }
  if (!name) return { ok: false, message: "Le nom est requis." }
  if (phoneNumber && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phoneNumber)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }
  if (!["super_admin", "admin", "moderator"].includes(adminRole)) {
    return { ok: false, message: "Rôle administrateur invalide." }
  }

  const cleanPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || null

  await db
    .update(userTable)
    .set({ name, phoneNumber: cleanPhoneNumber, updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  revalidatePath("/admin/collaborateurs")

  return { ok: true, message: "Collaborateur mis à jour avec succès." }
}

export async function toggleAdminCollaboratorStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const userId = String(formData.get("userId") ?? "")
  const currentRole = String(formData.get("currentRole") ?? "")

  if (!userId) return { ok: false, message: "Collaborateur introuvable." }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas modifier votre propre statut." }
  if (currentRole !== "admin") return { ok: false, message: "Seuls les comptes administrateurs peuvent être désactivés." }

  await db
    .update(userTable)
    .set({ role: "client", updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  revalidatePath("/admin/collaborateurs")
  revalidatePath("/admin/users")

  return {
    ok: true,
    message: "Le collaborateur a été désactivé (rôle Usager).",
  }
}

export async function reactivateAdminCollaborator(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()

  const userId = String(formData.get("userId") ?? "")

  if (!userId) return { ok: false, message: "Collaborateur introuvable." }

  await db
    .update(userTable)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  revalidatePath("/admin/collaborateurs")
  revalidatePath("/admin/users")

  return {
    ok: true,
    message: "Le collaborateur a été réactivé (rôle Administrateur).",
  }
}