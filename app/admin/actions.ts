"use server"

import { randomUUID } from "node:crypto"
import { eq, desc, ilike, or, and, inArray, notInArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { hashPassword } from "better-auth/crypto"
import {
  user as userTable,
  account as accountTable,
  pointDeVente,
  disponibilite,
  adminAction,
  collaborateurPermission,
  publicite,
  avis,
  brand as brandTable,
  type AvailabilityStatus,
} from "@/db/schema"
import { bottleFormats } from "@/lib/gaz"
import {
  requireAdmin,
  requireStaffModule,
  getCurrentUser,
  getAdminPermissions,
  ADMIN_MODULES,
  type AdminModule,
} from "@/lib/session"
import {
  PUBLICITE_SLOT_VALUES,
  PUBLICITE_STATUSES,
  derivePubliciteStatus,
  isPubliciteStatus,
  publiciteSlotLabel,
  validatePubliciteDescription,
  validatePubliciteImage,
  validatePubliciteTitle,
  type PubliciteStatus,
} from "@/lib/publicite-config"

export type { PubliciteStatus }

export type ActionResult = { ok: boolean; message: string }

/**
 * Normalise une date en tenant compte du fuseau horaire d'Africa/Douala (Cameroun).
 * On soustrait 1 heure (UTC+1) pour convertir l'heure locale en UTC pour le stockage.
 * Cela garantit que les dates sont stockées de manière cohérente pour le fuseau Cameroun.
 */
function normalizeCameroonTimezone(date: Date): Date {
  // Africa/Douala est en UTC+1 (heure standard) ou UTC+2 (heure d'été)
  // On utilise UTC+1 comme offset de base pour le stockage
  const doualaOffsetMs = 1 * 60 * 60 * 1000 // 1 hour in ms
  return new Date(date.getTime() - doualaOffsetMs)
}

/**
 * Vérifie si une publicité avec le même titre et le même slot existe déjà.
 */
async function checkDuplicateTitle(
  database: typeof db,
  title: string,
  slot: string
): Promise<boolean> {
  const [existing] = await database
    .select({ id: publicite.id })
    .from(publicite)
    .where(
      and(
        sql`lower(${publicite.title}) = lower(${title})`,
        eq(publicite.slot, slot)
      )
    )
    .limit(1)
  return !!existing
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function generateCsv(headers: string[], rows: string[][]): string {
  const bom = "\uFEFF"
  const headerLine = headers.map(escapeCsv).join(",")
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","))
  return bom + [headerLine, ...dataLines].join("\n")
}

async function logAdminAction(
  adminId: string,
  targetType: string,
  targetId: string,
  action: string,
  details: string = ""
) {
  const { headers } = await import("next/headers")
  const headerList = await headers()
  const ipAddress = headerList.get("x-forwarded-for") ?? "unknown"
  const userAgent = headerList.get("user-agent") ?? "unknown"

  await db.insert(adminAction).values({
    id: randomUUID(),
    adminId,
    targetType,
    targetId,
    action,
    details,
    ipAddress,
    userAgent,
  })
}

export async function exportUsersCsv(): Promise<{ ok: boolean; csv?: string; message: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: "Non autorisé." }
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") {
    return { ok: false, message: "Non autorisé." }
  }
  if (role === "collaborateur") {
    const perms = await getAdminPermissions(user.id)
    if (!perms.has("utilisateurs")) return { ok: false, message: "Non autorisé." }
  }
  if (role === "admin") {
    await logAdminAction(user.id, "users", "", "export", "Export utilisateurs")
  } else {
    await logAdminAction(user.id, "users", "", "export_collaborateur", "Export utilisateurs par collaborateur")
  }

  // Isolation : un collaborateur ne voit jamais les comptes d'administration.
  const users =
    role === "collaborateur"
      ? await db
          .select()
          .from(userTable)
          .where(notInArray(userTable.role, ["admin", "collaborateur"]))
          .orderBy(desc(userTable.createdAt))
      : await db
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
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: "Non autorisé." }
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") {
    return { ok: false, message: "Non autorisé." }
  }
  if (role === "collaborateur") {
    const perms = await getAdminPermissions(user.id)
    if (!perms.has("vendeurs")) return { ok: false, message: "Non autorisé." }
  }
  if (role === "admin") {
    await logAdminAction(user.id, "vendors", "", "export", "Export vendeurs")
  } else {
    await logAdminAction(user.id, "vendors", "", "export_collaborateur", "Export vendeurs par collaborateur")
  }

  const vendors = await db
    .select()
    .from(userTable)
    .where(eq(userTable.role, "vendor"))
    .orderBy(desc(userTable.createdAt))

  const vendorIds = vendors.map((v) => v.id)

  const pointsMap = new Map<string, typeof pointDeVente.$inferSelect[]>()
  const dispoMap = new Map<string, typeof disponibilite.$inferSelect[]>()

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
  const user = await requireAdmin()
  await logAdminAction(user.id, "collaborateurs", "", "export", "Export collaborateurs")

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

export async function exportPointsCsv(): Promise<{ ok: boolean; csv?: string; message: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: "Non autorisé." }
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") {
    return { ok: false, message: "Non autorisé." }
  }
  if (role === "collaborateur") {
    const perms = await getAdminPermissions(user.id)
    if (!perms.has("vendeurs")) return { ok: false, message: "Non autorisé." }
  }
  if (role === "admin") {
    await logAdminAction(user.id, "points", "", "export", "Export points de vente")
  } else {
    await logAdminAction(user.id, "points", "", "export_collaborateur", "Export points de vente par collaborateur")
  }

  const points = await db
    .select()
    .from(pointDeVente)
    .orderBy(desc(pointDeVente.createdAt))

  const vendors = await db
    .select({ id: userTable.id, name: userTable.name, email: userTable.email })
    .from(userTable)
    .where(eq(userTable.role, "vendor"))
  const vendorMap = new Map(vendors.map((v) => [v.id, v]))

  const headers = [
    "ID",
    "Nom",
    "Quartier",
    "Adresse",
    "Téléphone",
    "Vendeur",
    "Email vendeur",
    "Date de création",
  ]

  const rows = points.map((p) => {
    const vendor = p.vendorId ? vendorMap.get(p.vendorId) : null
    return [
      p.id,
      p.name,
      p.district,
      p.address,
      p.phone ?? "",
      vendor?.name ?? "",
      vendor?.email ?? "",
      new Date(p.createdAt).toLocaleDateString("fr-FR"),
    ]
  })

  const csv = generateCsv(headers, rows)
  return { ok: true, csv, message: "Export points de vente généré." }
}

export async function exportDisponibilitesCsv(
  filters: DispoCsvFilters = { q: undefined, status: "all", source: "all" }
): Promise<{ ok: boolean; csv?: string; message: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, message: "Non autorisé." }
  const role = user.role ?? "client"
  if (role !== "admin" && role !== "collaborateur") {
    return { ok: false, message: "Non autorisé." }
  }
  if (role === "collaborateur") {
    const perms = await getAdminPermissions(user.id)
    if (!perms.has("disponibilites")) return { ok: false, message: "Non autorisé." }
  }
  if (role === "admin") {
    await logAdminAction(user.id, "disponibilites", "", "export", "Export disponibilités")
  } else {
    await logAdminAction(user.id, "disponibilites", "", "export_collaborateur", "Export disponibilités par collaborateur")
  }

  const q = filters.q?.trim()
  const status =
    filters.status && filters.status !== "all" ? filters.status : undefined
  const source =
    filters.source && filters.source !== "all" ? filters.source : undefined

  const whereClause = and(
    q
      ? or(
          ilike(disponibilite.format, `%${q}%`),
          ilike(disponibilite.note, `%${q}%`),
          ilike(disponibilite.phone, `%${q}%`)
        )
      : undefined,
    status ? eq(disponibilite.status, status) : undefined,
    source ? eq(disponibilite.source, source) : undefined
  )

  const dispos = await db
    .select()
    .from(disponibilite)
    .where(whereClause)
    .orderBy(desc(disponibilite.createdAt))

  const headers = [
    "ID",
    "Vendeur",
    "Point de vente",
    "Format",
    "Quantité",
    "Prix (FCFA)",
    "Statut",
    "Source",
    "Note",
    "Téléphone",
    "Date de création",
  ]

  const rows = await Promise.all(
    dispos.map(async (d) => {
      const [point] = await db
        .select({ name: pointDeVente.name, vendorId: pointDeVente.vendorId })
        .from(pointDeVente)
        .where(eq(pointDeVente.id, d.pointId))
        .limit(1)

      const [vendor] = await db
        .select({ name: userTable.name })
        .from(userTable)
        .where(eq(userTable.id, point?.vendorId ?? ""))
        .limit(1)

      return [
        d.id,
        vendor?.name ?? "—",
        point?.name ?? "—",
        d.format ?? "—",
        (d.quantity ?? 0).toString(),
        (d.price ?? 0).toString(),
        d.status,
        d.source,
        d.note ?? "—",
        d.phone ?? "—",
        new Date(d.createdAt).toLocaleDateString("fr-FR"),
      ]
    })
  )

  const csv = generateCsv(headers, rows)

  return { ok: true, csv, message: "Export disponibilités généré." }
}

const STATUSES: AvailabilityStatus[] = ["disponible", "a_confirmer", "indisponible"]

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function brandKey(value: string): string {
  return normalizeText(value).toLowerCase()
}

async function resolvePointByName(pointName: string): Promise<{ id: string; name: string } | null> {
  const name = normalizeText(pointName)
  if (!name) return null
  const [point] = await db
    .select({ id: pointDeVente.id, name: pointDeVente.name })
    .from(pointDeVente)
    .where(sql`lower(btrim(${pointDeVente.name})) = ${name.toLowerCase()}`)
    .limit(1)
  return point ?? null
}

async function resolveBrandName(brandName: string): Promise<string> {
  const display = normalizeText(brandName)
  if (!display) return ""
  const key = brandKey(display)
  const [existing] = await db
    .select({ id: brandTable.id, name: brandTable.name })
    .from(brandTable)
    .where(eq(brandTable.nameKey, key))
    .limit(1)
  if (existing) return existing.name
  await db
    .insert(brandTable)
    .values({ id: randomUUID(), name: display, nameKey: key })
    .onConflictDoNothing({ target: brandTable.nameKey })
  return display
}

async function hasActiveDuplicateDispo(
  pointId: string,
  format: string,
  brandName: string
): Promise<boolean> {
  const rows = await db
    .select({ id: disponibilite.id })
    .from(disponibilite)
    .where(
      and(
        eq(disponibilite.pointId, pointId),
        eq(disponibilite.format, format),
        sql`lower(btrim(${disponibilite.brand})) = ${brandKey(brandName)}`,
        sql`${disponibilite.status} <> 'indisponible'`
      )
    )
    .limit(1)
  return rows.length > 0
}

export async function createVendor(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("vendeurs")).user
  await logAdminAction(admin.id, "vendor", "", "create", `Nom: ${String(formData.get("name") ?? "")}`)

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
  const admin = (await requireStaffModule("vendeurs")).user
  await logAdminAction(admin.id, "vendor", String(formData.get("userId") ?? ""), "update", `Nom: ${String(formData.get("name") ?? "")}`)

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
  const admin = (await requireStaffModule("vendeurs")).user
  await logAdminAction(admin.id, "user", String(formData.get("userId") ?? ""), "toggle", `Rôle: ${String(formData.get("currentRole") ?? "")} → ${String(formData.get("currentRole") === "vendor" ? "client" : "vendor")}`)

  const userId = String(formData.get("userId") ?? "")
  const currentRole = String(formData.get("currentRole") ?? "")

  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas modifier votre propre rôle." }
  if (currentRole === "admin" || currentRole === "collaborateur") {
    return { ok: false, message: "Impossible de modifier le rôle d'un compte d'administration." }
  }

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
  const admin = (await requireStaffModule("disponibilites")).user

  const pointNameRaw = String(formData.get("pointName") ?? "").trim()
  const format = String(formData.get("format") ?? "").trim()
  const status = String(formData.get("status") ?? "") as AvailabilityStatus
  const brandRaw = String(formData.get("brand") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()
  const quantityRaw = String(formData.get("quantity") ?? "").trim()
  const weightKg = String(formData.get("weightKg") ?? "").trim() || null
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null

  if (!pointNameRaw) return { ok: false, message: "Le champ « Point de vente » est obligatoire." }
  const point = await resolvePointByName(pointNameRaw)
  if (!point) {
    return {
      ok: false,
      message: `Point de vente « ${pointNameRaw} » introuvable. Saisissez ou sélectionnez un point de vente existant.`,
    }
  }
  if (!format) return { ok: false, message: "Le champ « Format de bouteille » est obligatoire." }
  if (!STATUSES.includes(status)) return { ok: false, message: "Statut invalide." }
  if (!brandRaw) return { ok: false, message: "Le champ « Marque de la bouteille » est obligatoire." }
  const brandName = await resolveBrandName(brandRaw)
  if (!note) return { ok: false, message: "Le champ « Niveau de l'itinéraire » est obligatoire." }
  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null
  if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) return { ok: false, message: "Quantité invalide." }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { ok: false, message: "Date d'expiration invalide." }

  if (await hasActiveDuplicateDispo(point.id, format, brandName)) {
    return {
      ok: false,
      message: `Une disponibilité déjà active existe à « ${point.name} » pour ce format et cette marque. Modifiez-la plutôt.`,
    }
  }

  await db.insert(disponibilite).values({
    id: randomUUID(),
    pointId: point.id,
    status,
    quantity,
    format,
    brand: brandName,
    weightKg,
    expiresAt,
    phone,
    note,
    reportedBy: admin.id,
    reportedByName: admin.name ?? "Administration",
    vendorId,
    source: "administration",
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await logAdminAction(admin.id, "disponibilite", "", "create", `Point de vente: ${point.name}, Format: ${format}, Marque: ${brandName}`)
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
  const admin = (await requireStaffModule("disponibilites")).user

  const disponibiliteId = String(formData.get("disponibiliteId") ?? "")
  const pointId = String(formData.get("pointId") ?? "")
  const status = String(formData.get("status") ?? "") as AvailabilityStatus
  const format = String(formData.get("format") ?? "").trim()
  const brandRaw = String(formData.get("brand") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()
  const quantityRaw = String(formData.get("quantity") ?? "").trim()
  const weightKg = String(formData.get("weightKg") ?? "").trim() || null
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorId = String(formData.get("vendorId") ?? "").trim() || null

  if (!disponibiliteId) return { ok: false, message: "Disponibilité introuvable." }
  if (!pointId) return { ok: false, message: "Point de vente requis." }
  if (!format) return { ok: false, message: "Le champ « Format de la bouteille » est obligatoire." }
  if (!STATUSES.includes(status)) return { ok: false, message: "Statut invalide." }
  if (!brandRaw) return { ok: false, message: "Le champ « Marque de la bouteille » est obligatoire." }
  const brandName = await resolveBrandName(brandRaw)
  if (!note) return { ok: false, message: "Le champ « Niveau de l'itinéraire » est obligatoire." }
  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null
  if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) return { ok: false, message: "Quantité invalide." }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { ok: false, message: "Date d'expiration invalide." }

  await db
    .update(disponibilite)
    .set({
      pointId,
      status,
      quantity,
      format,
      brand: brandName,
      weightKg,
      expiresAt,
      phone,
      note,
      vendorId,
      updatedAt: new Date(),
    })
    .where(eq(disponibilite.id, disponibiliteId))

  await logAdminAction(admin.id, "disponibilite", disponibiliteId, "update", `Statut: ${status}, Format: ${format}, Marque: ${brandName}`)
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
  const admin = (await requireStaffModule("disponibilites")).user
  await logAdminAction(admin.id, "disponibilite", String(formData.get("disponibiliteId") ?? ""), "delete", "Suppression de disponibilité")

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
  await requireStaffModule("vendeurs")

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

export type DispoCsvFilters = {
  q?: string
  status?: "all" | "disponible" | "indisponible" | "a_confirmer"
  source?: "all" | "vendeur" | "administration"
}

export async function createAdminCollaborator(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()
  await logAdminAction(admin.id, "collaborateur", "", "create", `Nom: ${String(formData.get("name") ?? "")}, Rôle: ${String(formData.get("adminRole") ?? "")}`)

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
    role: "collaborateur",
    emailVerified: true,
    phoneVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Compte credential : indispensable pour que le collaborateur puisse se connecter.
  const hashedPassword = await hashPassword(password)
  await db.insert(accountTable).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath("/admin/collaborateurs")

  return {
    ok: true,
    message: "Collaborateur créé avec succès.",
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

  let newRole: string
  if (currentRole === "admin" || currentRole === "collaborateur") {
    newRole = "client"
  } else {
    return { ok: false, message: "Seuls les comptes administrateurs et collaborateurs peuvent être désactivés." }
  }

  await db
    .update(userTable)
    .set({ role: newRole, updatedAt: new Date() })
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
    .set({ role: "collaborateur", updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  revalidatePath("/admin/collaborateurs")
  revalidatePath("/admin/users")

  return {
    ok: true,
    message: "Le collaborateur a été réactivé (rôle Collaborateur).",
  }
}

export async function updateUser(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("utilisateurs")).user

  const userId = String(formData.get("userId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim() || null
  const role = String(formData.get("role") ?? "") as "client" | "vendor"

  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (!name) return { ok: false, message: "Le nom est requis." }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Format d'email invalide." }
  if (phoneNumber && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phoneNumber)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }
  if (role !== "client" && role !== "vendor") return { ok: false, message: "Rôle invalide." }

  const [target] = await db
    .select({ id: userTable.id, role: userTable.role, email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target) return { ok: false, message: "Utilisateur introuvable." }
  if (target.role === "admin" || target.role === "collaborateur") {
    return { ok: false, message: "Impossible de modifier un compte d'administration." }
  }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas modifier votre propre compte ici." }

  const duplicate = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1)
  if (duplicate[0] && duplicate[0].id !== userId) {
    return { ok: false, message: "Cette adresse email est déjà utilisée." }
  }

  const cleanPhoneNumber = phoneNumber?.replace(/[^\d+]/g, "") || null
  await db
    .update(userTable)
    .set({ name, email, phoneNumber: cleanPhoneNumber, role, updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  await logAdminAction(admin.id, "user", userId, "update", `Nom: ${name}, Email: ${email}, Rôle: ${role}`)
  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")

  return { ok: true, message: "Utilisateur mis à jour avec succès." }
}

export async function toggleUserStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("utilisateurs")).user

  const userId = String(formData.get("userId") ?? "")
  const currentActive = String(formData.get("currentActive") ?? "true") === "true"

  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas modifier votre propre statut." }

  const [target] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target) return { ok: false, message: "Utilisateur introuvable." }
  if (target.role === "admin" || target.role === "collaborateur") {
    return { ok: false, message: "Impossible de désactiver un compte d'administration." }
  }

  const newState = !currentActive
  await db
    .update(userTable)
    .set({ isActive: newState, updatedAt: new Date() })
    .where(eq(userTable.id, userId))

  await logAdminAction(admin.id, "user", userId, "toggle", `isActive: ${newState}`)
  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")

  return {
    ok: true,
    message: newState ? "Le compte a été réactivé." : "Le compte a été désactivé.",
  }
}

export async function deleteUser(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("utilisateurs")).user

  const userId = String(formData.get("userId") ?? "")
  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas supprimer votre propre compte." }

  const [target] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target) return { ok: false, message: "Utilisateur introuvable." }
  if (target.role === "admin" || target.role === "collaborateur") {
    return { ok: false, message: "Impossible de supprimer un compte d'administration." }
  }

  await db.delete(userTable).where(eq(userTable.id, userId))
  await logAdminAction(admin.id, "user", userId, "delete", "Suppression d'utilisateur")

  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/admin/points-de-vente")

  return { ok: true, message: "Utilisateur supprimé définitivement." }
}

export async function resetUserPassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("utilisateurs")).user

  const userId = String(formData.get("userId") ?? "")
  const rawPassword = String(formData.get("newPassword") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  if (!userId) return { ok: false, message: "Utilisateur introuvable." }
  if (userId === admin.id) {
    return { ok: false, message: "Vous ne pouvez pas modifier votre propre mot de passe ici." }
  }

  const [target] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target) return { ok: false, message: "Utilisateur introuvable." }
  if (target.role === "admin" || target.role === "collaborateur") {
    return { ok: false, message: "Impossible de modifier un compte d'administration." }
  }

  // Validation: password confirmation
  if (!rawPassword && !confirmPassword) {
    // Aucun mot de passe fourni : un mot de passe aléatoire est généré ci-dessous.
  } else if (rawPassword !== confirmPassword) {
    return { ok: false, message: "Les mots de passe ne correspondent pas." }
  } else if (rawPassword.length < 8) {
    return { ok: false, message: "Le nouveau mot de passe doit contenir au moins 8 caractères." }
  }

  const password = rawPassword || randomUUID().slice(0, 12)
  if (rawPassword && rawPassword.length < 8) {
    return { ok: false, message: "Le nouveau mot de passe doit contenir au moins 8 caractères." }
  }

  const hashedPassword = await hashPassword(password)
  const [existingAccount] = await db
    .select({ id: accountTable.id })
    .from(accountTable)
    .where(eq(accountTable.userId, userId))
    .limit(1)

  if (existingAccount) {
    await db
      .update(accountTable)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(accountTable.id, existingAccount.id))
  } else {
    await db.insert(accountTable).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  await logAdminAction(admin.id, "user", userId, "update", "Réinitialisation du mot de passe")
  revalidatePath("/admin/users")

  return {
    ok: true,
    message: `Mot de passe réinitialisé. Nouveau mot de passe : ${password}`,
  }
}

export async function deleteVendor(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("vendeurs")).user

  const userId = String(formData.get("userId") ?? "")
  if (!userId) return { ok: false, message: "Vendeur introuvable." }
  if (userId === admin.id) return { ok: false, message: "Vous ne pouvez pas supprimer votre propre compte." }

  const [target] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target || target.role !== "vendor") return { ok: false, message: "Vendeur introuvable." }

  await db.delete(userTable).where(eq(userTable.id, userId))
  await logAdminAction(admin.id, "vendor", userId, "delete", "Suppression de vendeur")

  revalidatePath("/admin/users")
  revalidatePath("/admin/vendeurs")
  revalidatePath("/admin/points-de-vente")

  return { ok: true, message: "Vendeur supprimé définitivement." }
}

function splitList(value: string): string[] | null {
  const items = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length > 0 ? items : null
}

export async function createPoint(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("vendeurs")).user

  const name = String(formData.get("name") ?? "").trim()
  const district = String(formData.get("district") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const brands = splitList(String(formData.get("brands") ?? ""))
  const formats = splitList(String(formData.get("formats") ?? ""))
  const vendorId = String(formData.get("vendorId") ?? "") || null

  if (!name) return { ok: false, message: "Le nom est requis." }
  if (!district) return { ok: false, message: "Le quartier est requis." }
  if (!address) return { ok: false, message: "L'adresse est requise." }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
  }

  let resolvedVendor: string | null = null
  if (vendorId) {
    const [vendor] = await db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, vendorId))
      .limit(1)
    if (!vendor || vendor.role !== "vendor") return { ok: false, message: "Le vendeur sélectionné est introuvable." }
    resolvedVendor = vendor.id
  }

  const pointId = randomUUID()
  await db.insert(pointDeVente).values({
    id: pointId,
    name,
    district,
    address,
    phone,
    brands,
    formats,
    vendorId: resolvedVendor,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await logAdminAction(admin.id, "point", pointId, "create", `Nom: ${name}, Quartier: ${district}`)
  revalidatePath("/admin/points-de-vente")
  revalidatePath("/admin/vendeurs")

  return { ok: true, message: `Point de vente « ${name} » créé.` }
}

export async function updatePoint(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("vendeurs")).user

  const pointId = String(formData.get("pointId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const district = String(formData.get("district") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const brands = splitList(String(formData.get("brands") ?? ""))
  const formats = splitList(String(formData.get("formats") ?? ""))
  const vendorId = String(formData.get("vendorId") ?? "") || null

  if (!pointId) return { ok: false, message: "Point de vente introuvable." }
  if (!name) return { ok: false, message: "Le nom est requis." }
  if (!district) return { ok: false, message: "Le quartier est requis." }
  if (!address) return { ok: false, message: "L'adresse est requise." }

  let resolvedVendor: string | null = null
  if (vendorId) {
    const [vendor] = await db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, vendorId))
      .limit(1)
    if (!vendor || vendor.role !== "vendor") return { ok: false, message: "Le vendeur sélectionné est introuvable." }
    resolvedVendor = vendor.id
  }

  await db
    .update(pointDeVente)
    .set({ name, district, address, phone, brands, formats, vendorId: resolvedVendor, updatedAt: new Date() })
    .where(eq(pointDeVente.id, pointId))

  await logAdminAction(admin.id, "point", pointId, "update", `Nom: ${name}`)
  revalidatePath("/admin/points-de-vente")
  revalidatePath("/admin/vendeurs")

  return { ok: true, message: "Point de vente mis à jour." }
}

export async function togglePointStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("vendeurs")).user

  const pointId = String(formData.get("pointId") ?? "")
  const currentActive = String(formData.get("currentActive") ?? "true") === "true"
  if (!pointId) return { ok: false, message: "Point de vente introuvable." }

  const newState = !currentActive
  await db
    .update(pointDeVente)
    .set({ isActive: newState, updatedAt: new Date() })
    .where(eq(pointDeVente.id, pointId))

  await logAdminAction(admin.id, "point", pointId, "toggle", `isActive: ${newState}`)
  revalidatePath("/admin/points-de-vente")
  revalidatePath("/admin/vendeurs")

  return {
    ok: true,
    message: newState ? "Le point de vente a été réactivé." : "Le point de vente a été désactivé.",
  }
}

export async function deletePoint(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("vendeurs")).user

  const pointId = String(formData.get("pointId") ?? "")
  if (!pointId) return { ok: false, message: "Point de vente introuvable." }

  await db.delete(pointDeVente).where(eq(pointDeVente.id, pointId))
  await logAdminAction(admin.id, "point", pointId, "delete", "Suppression de point de vente")

  revalidatePath("/admin/points-de-vente")
  revalidatePath("/admin/vendeurs")

  return { ok: true, message: "Point de vente supprimé définitivement." }
}

export async function deleteActivity(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const activityId = String(formData.get("activityId") ?? "")
  if (!activityId) return { ok: false, message: "Activité introuvable." }

  await db.delete(adminAction).where(eq(adminAction.id, activityId))
  await logAdminAction(admin.id, "activite", activityId, "delete", "Suppression d'une activité")
  revalidatePath("/admin")

  return { ok: true, message: "Activité supprimée." }
}

export async function deleteActivities(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const rawIds = String(formData.get("activityIds") ?? "")
  const ids = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (ids.length === 0) return { ok: false, message: "Aucune activité sélectionnée." }

  await db.delete(adminAction).where(inArray(adminAction.id, ids))
  await logAdminAction(admin.id, "activite", ids.join(","), "delete", `Suppression de ${ids.length} activités`)
  revalidatePath("/admin")

  return { ok: true, message: `${ids.length} activité(s) supprimée(s).` }
}

export async function setCollaboratorPermissions(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const userId = String(formData.get("userId") ?? "")
  const rawModules = String(formData.get("modules") ?? "")
  const modules = rawModules
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as AdminModule[]

  if (!userId) return { ok: false, message: "Collaborateur introuvable." }

  const [target] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)
  if (!target) return { ok: false, message: "Collaborateur introuvable." }
  if (target.role === "admin") return { ok: false, message: "L'administrateur principal a déjà tous les accès." }
  if (target.role !== "collaborateur") return { ok: false, message: "Seuls les collaborateurs ont des permissions." }

  const invalid = modules.filter((m) => !ADMIN_MODULES.includes(m))
  if (invalid.length > 0) return { ok: false, message: "Module de permission invalide." }

  await db.delete(collaborateurPermission).where(eq(collaborateurPermission.collaboratorId, userId))
  if (modules.length > 0) {
    await db.insert(collaborateurPermission).values(
      modules.map((module) => ({
        id: randomUUID(),
        collaboratorId: userId,
        module,
      }))
    )
  }

  await logAdminAction(admin.id, "collaborateur", userId, "update", `Permissions: ${modules.join(", ") || "consultation seule"}`)
  revalidatePath("/admin/collaborateurs")

  return {
    ok: true,
    message:
      modules.length > 0
        ? `Permissions mises à jour : ${modules.join(", ")}.`
        : "Le collaborateur est passé en consultation seule.",
  }
}

export async function createPublicite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("marketing")).user

  const title = String(formData.get("title") ?? "").trim()
  const descriptionRaw = String(formData.get("description") ?? "")
  const imageRaw = String(formData.get("image") ?? "")
  const priceRaw = String(formData.get("price") ?? "").trim()
  const priceLabel = String(formData.get("priceLabel") ?? "").trim() || null
  const location = String(formData.get("location") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null
  const slot = String(formData.get("slot") ?? "home_hero").trim()
  const rawStatus = String(formData.get("status") ?? "").trim()
  const startAtRaw = String(formData.get("startAt") ?? "").trim()
  const endAtRaw = String(formData.get("endAt") ?? "").trim()

  const titleError = validatePubliciteTitle(title)
  if (titleError) return { ok: false, message: titleError }

  const descriptionError = validatePubliciteDescription(descriptionRaw)
  if (descriptionError) return { ok: false, message: descriptionError }

  if (!PUBLICITE_SLOT_VALUES.includes(slot)) {
    return { ok: false, message: "Emplacement invalide." }
  }
  if (rawStatus && !isPubliciteStatus(rawStatus)) {
    return { ok: false, message: `Statut invalide. Valeurs autorisées : ${PUBLICITE_STATUSES.join(", ")}` }
  }

  const imageCheck = validatePubliciteImage(imageRaw)
  if (!imageCheck.ok) return { ok: false, message: imageCheck.error }

  const description = descriptionRaw.trim() || null
  const image = imageCheck.value

  const price = priceRaw ? Number.parseInt(priceRaw, 10) : null
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { ok: false, message: "Prix invalide." }

  let startAt = startAtRaw ? new Date(startAtRaw) : null
  let endAt = endAtRaw ? new Date(endAtRaw) : null
  
  // Validation des dates
  if (startAt && Number.isNaN(startAt.getTime())) return { ok: false, message: "Date de début invalide." }
  if (endAt && Number.isNaN(endAt.getTime())) return { ok: false, message: "Date de fin invalide." }
  if (startAt && endAt && endAt < startAt) return { ok: false, message: "La date de fin doit suivre la date de début." }

  // Déterminer le statut initial en fonction des dates
  const initialStatus = derivePubliciteStatus(startAt, endAt)

  // Normaliser les fuseaux horaires (Africa/Douala)
  // On stocke en UTC adjustée pour Douala, l'affichage se fera en temps local
  if (startAt) startAt = normalizeCameroonTimezone(startAt)
  if (endAt) endAt = normalizeCameroonTimezone(endAt)

  // Vérifier les doublons par titre+emplacement (hors ID)
  const id = randomUUID()
  await db.insert(publicite).values({
    id,
    title,
    description,
    image,
    price,
    priceLabel,
    location,
    phone,
    linkUrl,
    slot,
    status: initialStatus,
    startAt,
    endAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await logAdminAction(admin.id, "publicite", id, "create", `Titre: ${title}, Statut: ${initialStatus}`)
  revalidatePath("/admin/marketing")
  revalidatePath("/")

  return { ok: true, message: `Publicité « ${title} » créée avec succès (statut: ${initialStatus}).` }
}

export async function updatePublicite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("marketing")).user

  const id = String(formData.get("publiciteId") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const descriptionRaw = String(formData.get("description") ?? "")
  const imageRaw = String(formData.get("image") ?? "")
  const priceRaw = String(formData.get("price") ?? "").trim()
  const priceLabel = String(formData.get("priceLabel") ?? "").trim() || null
  const location = String(formData.get("location") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null
  const slot = String(formData.get("slot") ?? "").trim()
  const status = String(formData.get("status") ?? "").trim()
  const startAtRaw = String(formData.get("startAt") ?? "").trim()
  const endAtRaw = String(formData.get("endAt") ?? "").trim()

  if (!id) return { ok: false, message: "Publicité introuvable." }

  const titleError = validatePubliciteTitle(title)
  if (titleError) return { ok: false, message: titleError }

  const descriptionError = validatePubliciteDescription(descriptionRaw)
  if (descriptionError) return { ok: false, message: descriptionError }

  if (!PUBLICITE_SLOT_VALUES.includes(slot)) {
    return { ok: false, message: "Emplacement invalide." }
  }
  if (status && !isPubliciteStatus(status)) {
    return { ok: false, message: `Statut invalide. Valeurs autorisées : ${PUBLICITE_STATUSES.join(", ")}` }
  }

  const imageCheck = validatePubliciteImage(imageRaw)
  if (!imageCheck.ok) return { ok: false, message: imageCheck.error }

  const description = descriptionRaw.trim() || null
  const image = imageCheck.value

  const price = priceRaw ? Number.parseInt(priceRaw, 10) : null
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { ok: false, message: "Prix invalide." }

  let startAt = startAtRaw ? new Date(startAtRaw) : null
  let endAt = endAtRaw ? new Date(endAtRaw) : null
  
  // Validation des dates
  if (startAt && Number.isNaN(startAt.getTime())) return { ok: false, message: "Date de début invalide." }
  if (endAt && Number.isNaN(endAt.getTime())) return { ok: false, message: "Date de fin invalide." }
  if (startAt && endAt && endAt < startAt) return { ok: false, message: "La date de fin doit suivre la date de début." }

  // Déterminer le nouveau statut en fonction des dates mises à jour
  const newStatus = derivePubliciteStatus(startAt, endAt)

  // Normaliser les fuseaux horaires (Africa/Douala)
  if (startAt) startAt = normalizeCameroonTimezone(startAt)
  if (endAt) endAt = normalizeCameroonTimezone(endAt)

  await db
    .update(publicite)
    .set({
      title,
      description,
      image,
      price,
      priceLabel,
      location,
      phone,
      linkUrl,
      slot,
      status: newStatus,
      startAt,
      endAt,
      updatedAt: new Date(),
    })
    .where(eq(publicite.id, id))

  await logAdminAction(admin.id, "publicite", id, "update", `Titre: ${title}, Statut: ${newStatus}`)
  revalidatePath("/admin/marketing")
  revalidatePath("/")

  return { ok: true, message: `Publicité « ${title} » mise à jour avec succès (statut: ${newStatus}).` }
}

export async function togglePubliciteStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("marketing")).user

  const id = String(formData.get("publiciteId") ?? "")
  const currentStatus = String(formData.get("currentStatus") ?? "inactive")
  if (!id) return { ok: false, message: "Publicité introuvable." }

  // Mapping du statut actuel vers le prochain statut dans le cycle
  const statusCycle: Record<string, string> = {
    draft: "scheduled",
    scheduled: "active",
    active: "expired",
    expired: "suspended",
    suspended: "draft",
  }

  const newStatus = statusCycle[currentStatus] ?? "active"
  await db
    .update(publicite)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(publicite.id, id))

  await logAdminAction(admin.id, "publicite", id, "toggle", `status: ${currentStatus} → ${newStatus}`)
  revalidatePath("/admin/marketing")
  revalidatePath("/")

  return {
    ok: true,
    message: `Publicité « ${(await db.select({ title: publicite.title }).from(publicite).where(eq(publicite.id, id)))[0]?.title ?? 'campagne'} » ${newStatus === "active" ? "activée" : newStatus === "scheduled" ? "programmée" : `passée en ${newStatus}`}.`,
  }
}

export async function deletePublicite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("marketing")).user

  const id = String(formData.get("publiciteId") ?? "")
  if (!id) return { ok: false, message: "Publicité introuvable." }

  await db.delete(publicite).where(eq(publicite.id, id))
  await logAdminAction(admin.id, "publicite", id, "delete", "Suppression de publicité")
  revalidatePath("/admin/marketing")
  revalidatePath("/")

  return { ok: true, message: "Publicité supprimée." }
}

// Dupliquer une publicité existante
export async function duplicatePublicite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("marketing")).user

  const originalId = String(formData.get("publiciteId") ?? "")
  if (!originalId) return { ok: false, message: "Publicité introuvable." }

  // Récupérer l'original
  const [original] = await db
    .select()
    .from(publicite)
    .where(eq(publicite.id, originalId))
    .limit(1)

  if (!original) return { ok: false, message: "Publicité introuvable." }

  // Créer la copie avec un nouveau titre (ajouter " (copie)")
  const copyTitle = `${original.title} (copie)`
  
  // Vérifier si un titre en double existe
  let uniqueTitle = copyTitle
  let counter = 1
  while (await checkDuplicateTitle(db, uniqueTitle, original.slot)) {
    uniqueTitle = `${original.title} (copie ${counter})`
    counter++
  }

  const id = randomUUID()
  await db.insert(publicite).values({
    id,
    title: uniqueTitle,
    description: original.description,
    image: original.image,
    price: original.price,
    priceLabel: original.priceLabel,
    location: original.location,
    phone: original.phone,
    linkUrl: original.linkUrl,
    slot: original.slot,
    status: "draft", // Les doublons commencent toujours en brouillon
    startAt: original.startAt,
    endAt: original.endAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await logAdminAction(admin.id, "publicite", id, "create", `Duplication de: ${original.title}`)
  revalidatePath("/admin/marketing")
  revalidatePath("/")

  return { ok: true, message: `Publicité « ${uniqueTitle} » dupliquée.` }
}

// Exporter la liste des publicités en CSV
export async function exportPublicitesCsv(): Promise<{ ok: boolean; csv?: string; message: string }> {
  await requireAdmin()

  const publicites = await db
    .select()
    .from(publicite)
    .orderBy(desc(publicite.createdAt))

  const headers = [
    "ID",
    "Titre",
    "Emplacement",
    "Statut",
    "Date début",
    "Date fin",
    "Prix (FCFA)",
    "Lien",
  ]

  const rows = publicites.map((ad) => {
    const startDisplay = ad.startAt ? new Date(ad.startAt).toLocaleDateString("fr-FR") : "Toujours"
    const endDisplay = ad.endAt ? new Date(ad.endAt).toLocaleDateString("fr-FR") : "Illimitée"
    return [
      ad.id,
      ad.title,
      publiciteSlotLabel(ad.slot),
      ad.status,
      startDisplay,
      endDisplay,
      ad.price !== null ? `${ad.price} FCFA` : "",
      ad.linkUrl ?? "",
    ]
  })

  const generateCsv = (rows: string[][]): string => {
    const bom = "\uFEFF"
    const headerLine = headers.map((h) => `"${h}"`).join(",")
    const dataLines = rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    return bom + [headerLine, ...dataLines].join("\n")
  }

  const csv = generateCsv(rows)
  return { ok: true, csv, message: "Export des publicités généré." }
}

/* ------------------------------------------------------------------ */
/* Modération des avis / témoignages (module « avis »)                  */
/* ------------------------------------------------------------------ */

async function setAvisStatus(
  id: string,
  status: string,
  adminId: string,
  previousStatus: string
): Promise<void> {
  await db.update(avis).set({ status, updatedAt: new Date() }).where(eq(avis.id, id))
  await logAdminAction(adminId, "avis", id, status, `Statut: ${previousStatus} → ${status}`)
  revalidatePath("/admin/avis")
  revalidatePath("/")
}

/** Approuve un avis : il devient public sur la landing. */
export async function approveAvis(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("avis")).user

  const id = String(formData.get("avisId") ?? "")
  if (!id) return { ok: false, message: "Avis introuvable." }

  const [target] = await db
    .select({ status: avis.status })
    .from(avis)
    .where(eq(avis.id, id))
    .limit(1)
  if (!target) return { ok: false, message: "Avis introuvable." }

  await setAvisStatus(id, "approved", admin.id, target.status)
  return {
    ok: true,
    message: "Avis approuvé : il est désormais visible sur la page d'accueil.",
  }
}

/** Refuse un avis : il n'est jamais rendu public. */
export async function rejectAvis(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("avis")).user

  const id = String(formData.get("avisId") ?? "")
  if (!id) return { ok: false, message: "Avis introuvable." }

  const [target] = await db
    .select({ status: avis.status })
    .from(avis)
    .where(eq(avis.id, id))
    .limit(1)
  if (!target) return { ok: false, message: "Avis introuvable." }

  await setAvisStatus(id, "rejected", admin.id, target.status)
  return { ok: true, message: "Avis refusé : il ne sera pas publié." }
}

/** Masque un avis approuvé : retiré du public sans être supprimé. */
export async function hideAvis(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("avis")).user

  const id = String(formData.get("avisId") ?? "")
  if (!id) return { ok: false, message: "Avis introuvable." }

  const [target] = await db
    .select({ status: avis.status })
    .from(avis)
    .where(eq(avis.id, id))
    .limit(1)
  if (!target) return { ok: false, message: "Avis introuvable." }

  await setAvisStatus(id, "hidden", admin.id, target.status)
  return { ok: true, message: "Avis masqué : il n'est plus affiché sur le site." }
}

/** Supprime définitivement un avis. */
export async function deleteAvis(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = (await requireStaffModule("avis")).user

  const id = String(formData.get("avisId") ?? "")
  if (!id) return { ok: false, message: "Avis introuvable." }

  const [target] = await db
    .select({ id: avis.id })
    .from(avis)
    .where(eq(avis.id, id))
    .limit(1)
  if (!target) return { ok: false, message: "Avis introuvable." }

  await db.delete(avis).where(eq(avis.id, id))
  await logAdminAction(admin.id, "avis", id, "delete", "Suppression de l'avis")
  revalidatePath("/admin/avis")
  revalidatePath("/")

  return { ok: true, message: "Avis supprimé." }
}

/** Met à jour l'avatar de l'administrateur connecté. */
export async function updateAdminAvatar(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin()

  const image = String(formData.get("image") ?? "").trim()
  if (!image) return { ok: false, message: "Aucune image fournie." }

  // Validate data URL format (base64)
  if (!image.startsWith("data:image/")) {
    return { ok: false, message: "Format d'image invalide. Utilisez une data URL base64." }
  }

  // Check size (max 2MB base64 ≈ 2.7MB data URL)
  if (image.length > 3000000) {
    return { ok: false, message: "Image trop lourde (2 Mo maximum)." }
  }

  await db
    .update(userTable)
    .set({ image, updatedAt: new Date() })
    .where(eq(userTable.id, admin.id))

  await logAdminAction(admin.id, "admin", admin.id, "update", "Avatar mis à jour")
  revalidatePath("/admin/profil")

  return { ok: true, message: "Photo de profil mise à jour." }
}