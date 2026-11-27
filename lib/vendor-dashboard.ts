import { and, count, desc, eq, gt, inArray, isNull, or } from "drizzle-orm"
import { db } from "@/db"
import {
  avis,
  disponibilite,
  pointDeVente,
  reservation,
  user,
  vendorOnboarding,
} from "@/db/schema"
import type { AvisMine } from "@/lib/avis-shared"
import { errorMessage } from "@/lib/errors"
import { effectiveStatus } from "@/lib/gaz"
import { getDepotRowsByVendorId } from "@/lib/vendor-depot-compat"
import { withTransientRetry } from "@/lib/transient-retry"

export type UserRole = "client" | "vendor" | "admin" | "collaborateur"
export type AvailabilityStatus = "disponible" | "a_confirmer" | "indisponible"
export type AvailabilitySource = "vendeur" | "administration"

// Keep existing VendorDepotDto type (same as before)
export type VendorDepotDto = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
  deliveryEnabled: boolean
  deliveryFee: number
  exchangeEnabled: boolean
  exchangeFee: number | null
  exchangeBrands: string[]
  exchangeFormats: string[]
  gasSaleEnabled: boolean
  gasSaleFee: number | null
  gasSaleBrands: string[]
  gasSaleFormats: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Keep existing VendorOverviewData type (backward compatible)
export type VendorActivityDto = {
  id: string
  type: "reservation" | "availability"
  title: string
  detail: string
  at: Date
  status: string
}

export type VendorOverviewData = {
  depot: VendorDepotDto | null
  stats: {
    depotCount: number
    activeAvailabilityCount: number
    reservationCount: number
  }
  activities: VendorActivityDto[]
  hasAnyData: boolean
  /** Erreurs de chargement rencontrées : affichées à l'utilisateur, jamais masquées. */
  loadErrors: string[]
}

// Type du données d'onboarding vendeur (retourné par getVendorOnboarding)
export type VendorOnboardingDto = {
  id: string
  pointName: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  inventory: unknown[]
  status: string
  pointDeVenteId: string | null
  createdAt: Date
}

// NEW: Type for single availability
export type VendorAvailabilityDto = {
  id: string
  pointId: string
  pointName: string | null
  brand: string | null
  format: string | null
  status: string
  effectiveStatus: string
  quantity: number | null
  reservedQuantity: number
  availableQuantity: number | null
  price: number | null
  note: string | null
  phone: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

// Get vendor onboarding data by vendorId
export async function getVendorOnboarding(
  vendorId: string
): Promise<VendorOnboardingDto | null> {
  try {
    const [row] = await db
      .select({
        id: vendorOnboarding.id,
        pointName: vendorOnboarding.pointName,
        district: vendorOnboarding.district,
        address: vendorOnboarding.address,
        phone: vendorOnboarding.phone,
        brands: vendorOnboarding.brands,
        inventory: vendorOnboarding.inventory,
        status: vendorOnboarding.status,
        pointDeVenteId: vendorOnboarding.pointDeVenteId,
        createdAt: vendorOnboarding.createdAt,
      })
      .from(vendorOnboarding)
      .where(eq(vendorOnboarding.userId, vendorId))
      .limit(1)

    return row ? (row as VendorOnboardingDto) : null
  } catch (err) {
    console.error("[vendor-dashboard] getVendorOnboarding failed:", errorMessage(err))
    throw err
  }
}

// Get availabilities for a vendor
export async function getVendorAvailabilities(
  vendorId: string
): Promise<{
  id: string
  pointId: string
  pointName: string | null
  brand: string | null
  format: string | null
  status: string
  effectiveStatus: string
  quantity: number | null
  reservedQuantity: number
  availableQuantity: number | null
  price: number | null
  note: string | null
  phone: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}[]> {
  try {
    const rows = await withTransientRetry(async () => {
      return await db
        .select({
          id: disponibilite.id,
          pointId: disponibilite.pointId,
          pointName: pointDeVente.name,
          brand: disponibilite.brand,
          format: disponibilite.format,
          status: disponibilite.status,
          quantity: disponibilite.quantity,
          reservedQuantity: disponibilite.reservedQuantity,
          price: disponibilite.price,
          note: disponibilite.note,
          phone: disponibilite.phone,
          expiresAt: disponibilite.expiresAt,
          createdAt: disponibilite.createdAt,
          updatedAt: disponibilite.updatedAt,
        })
        .from(disponibilite)
        .innerJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
        .where(eq(pointDeVente.vendorId, vendorId))
        .orderBy(desc(disponibilite.createdAt))
    })

    // Handle case where db returns null (connection issue)
    if (!rows || !Array.isArray(rows)) {
      console.warn("[vendor-dashboard] Query returned null/undefined, returning empty array")
      return []
    }

    // Le driver pg peut renvoyer les timestamps sous forme de chaînes : on ne
    // suppose jamais qu'ils exposent `.toISOString()`.
    return rows.map((row) => {
      const expiresAt = iso(row.expiresAt as Date | string | null)
      const expired = expiresAt != null && new Date(expiresAt).getTime() < Date.now()
      const computedStatus = expired
        ? "indisponible"
        : effectiveStatus(row.status, row.updatedAt as Date | string)

      return {
        ...row,
        effectiveStatus: computedStatus,
        availableQuantity:
          row.quantity != null ? Math.max(0, row.quantity - row.reservedQuantity) : null,
        expiresAt,
        createdAt: isoRequired(row.createdAt as Date | string),
        updatedAt: isoRequired(row.updatedAt as Date | string),
      }
    })
  } catch (err) {
    console.error("[vendor-dashboard] getVendorAvailabilities failed:", errorMessage(err))
    throw err
  }
}

// iso helper
function iso(value: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function isoRequired(value: Date | string): string {
  return iso(value) ?? new Date(0).toISOString()
}

// Get a single vendor depot by vendorId
export async function getVendorDepot(
  vendorId: string
): Promise<VendorDepotDto | null> {
  try {
    const rows = await getDepotRowsByVendorId(vendorId)
    return rows[0] ?? null
  } catch (err) {
    console.error("[vendor-dashboard] getVendorDepot failed:", errorMessage(err))
    throw err
  }
}

// Get all depots for a vendor
export async function getVendorDepots(
  vendorId: string
): Promise<VendorDepotDto[]> {
  try {
    return await getDepotRowsByVendorId(vendorId)
  } catch (err) {
    console.error("[vendor-dashboard] getVendorDepots failed:", errorMessage(err))
    throw err
  }
}

// Get vendor overview (backward compatible)
export async function getVendorOverview(
  vendorId: string
): Promise<VendorOverviewData> {
  // Récupérer TOUS les depots du vendeur en une seule requête. Le résultat est
  // réutilisé pour le dépôt principal (premier élément) et le décompte, afin
  // d'éviter un appel en double vers Neon.
  let allDepots: VendorDepotDto[] = []
  const loadErrors: string[] = []
  try {
    allDepots = await getVendorDepots(vendorId)
  } catch (err) {
    console.error("[vendor-dashboard] getVendorDepots failed:", errorMessage(err))
    loadErrors.push("Impossible de charger vos points de vente.")
  }

  const depot: VendorDepotDto | null = allDepots[0] ?? null

  // Compter les disponibilités actives au total
  let activeAvailabilityCount = 0
  try {
    const activeCountResult = await db
      .select({ value: count() })
      .from(disponibilite)
      .where(
        and(
          eq(disponibilite.vendorId, vendorId),
          eq(disponibilite.status, "disponible"),
          or(isNull(disponibilite.expiresAt), gt(disponibilite.expiresAt, new Date()))
        )
      )
    activeAvailabilityCount = activeCountResult[0]?.value ?? 0
  } catch (err) {
    console.error("[vendor-dashboard] active availability count failed:", errorMessage(err))
    loadErrors.push("Le nombre de disponibilités actives est momentanément indisponible.")
  }

  // Compter les réservations totales
  let reservationCount = 0
  try {
    const reservationCountResult = await db
      .select({ value: count() })
      .from(reservation)
      .where(eq(reservation.vendorId, vendorId))
    reservationCount = reservationCountResult[0]?.value ?? 0
  } catch (err) {
    console.error("[vendor-dashboard] reservation count failed:", errorMessage(err))
    loadErrors.push("Le nombre de réservations est momentanément indisponible.")
  }

  // Activities: last 5 activities (reservations + availabilities)
  // Déclarés en dehors du bloc try pour rester accessibles au calcul de
  // `hasAnyData` dans le retour (sinon ReferenceError à la compilation/exécution).
  let activities: VendorActivityDto[] = []
  let reservations: {
    reservation: typeof reservation.$inferSelect
    pointName: string | null
  }[] = []
  let availabilities: {
    availability: typeof disponibilite.$inferSelect
    pointName: string | null
  }[] = []
  try {
    reservations = await db
      .select({
        reservation,
        pointName: pointDeVente.name,
      })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(eq(reservation.vendorId, vendorId))
      .orderBy(desc(reservation.reservedAt))
      .limit(5)

    availabilities = await db
      .select({
        availability: disponibilite,
        pointName: pointDeVente.name,
      })
      .from(disponibilite)
      .innerJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
      .where(
        and(
          eq(pointDeVente.vendorId, vendorId),
          or(
            isNull(disponibilite.vendorId),
            eq(disponibilite.vendorId, vendorId)
          )
        )
      )
      .orderBy(desc(disponibilite.createdAt))
      .limit(5)

    // Build activities from reservations
    activities = [
      ...reservations.map((row) => ({
        id: `reservation-${row.reservation.id}`,
        type: "reservation" as const,
        title: `Réservation ${row.reservation.reservationCode}`,
        detail: `${row.reservation.clientName} · ${row.reservation.brand} ${row.reservation.format}`,
        at: row.reservation.reservedAt,
        status: row.reservation.status,
      })),
      // Add availabilities : le statut effectif est calculé en JS, comme dans
      // getVendorAvailabilities, pour ne pas dépendre d'une colonne SQL.
      ...availabilities.slice(0, 5).map((row) => {
        const expiresAt = row.availability.expiresAt
        const expired = expiresAt != null && new Date(expiresAt).getTime() < Date.now()
        const status = expired
          ? "indisponible"
          : effectiveStatus(row.availability.status, row.availability.updatedAt)

        return {
          id: `availability-${row.availability.id}`,
          type: "availability" as const,
          title: `${row.availability.brand ?? "Marque"} ${row.availability.format ?? ""}`.trim(),
          detail: `${row.pointName ?? "Dépôt"} · ${status === "disponible" ? "Disponible" : "Indisponible"}`,
          at: row.availability.updatedAt,
          status,
        }
      }),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5)
  } catch (err) {
    console.error("[vendor-dashboard] activities fetch failed:", errorMessage(err))
    loadErrors.push("L'activité récente n'a pas pu être chargée.")
  }

  return {
    depot,
    stats: {
      depotCount: allDepots.length,
      activeAvailabilityCount,
      reservationCount,
    },
    activities,
    hasAnyData:
      Boolean(depot) || availabilities.length > 0 || reservations.length > 0,
    loadErrors,
  }
}

// NEW: Get vendors depots summary for UI
export async function getVendorDepotsSummary(
  vendorId: string
): Promise<{
  depots: VendorDepotDto[]
  totalDepots: number
  activeDepots: number
}> {
  try {
    const depots = await getVendorDepots(vendorId)

    const totalDepots = depots.length
    const activeDepots = depots.filter((d) => d.isActive).length

    return {
      depots,
      totalDepots,
      activeDepots,
    }
  } catch (err) {
    console.error("[vendor-dashboard] getVendorDepotsSummary failed:", errorMessage(err))
    throw err
  }
}

// Get vendor review (for avis page)
export async function getVendorReview(vendorId: string): Promise<AvisMine | null> {
  try {
    const [row] = await db
      .select({
        id: avis.id,
        rating: avis.rating,
        quote: avis.quote,
        status: avis.status,
        createdAt: avis.createdAt,
        updatedAt: avis.updatedAt,
      })
      .from(avis)
      .where(eq(avis.userId, vendorId))
      .orderBy(desc(avis.createdAt))
      .limit(1)

    return row
      ? {
          id: row.id,
          rating: row.rating,
          quote: row.quote,
          status: row.status as AvisMine["status"],
          createdAt: isoRequired(row.createdAt as Date | string),
          updatedAt: isoRequired(row.updatedAt as Date | string),
        }
      : null
  } catch (err) {
    console.error("[vendor-dashboard] getVendorReview failed:", errorMessage(err))
    throw err
  }
}

export type VendorReservationDto = {
  id: string
  reservationCode: string
  clientName: string
  clientPhone: string | null
  pointId: string
  pointName: string | null
  brand: string
  format: string
  quantity: number
  amount: number
  amountType: string
  status: string
  reservedAt: string
  expiresAt: string | null
  collectedAt: string | null
  cancelledAt: string | null
}

export type VendorProfileDto = {
  id: string
  name: string | null
  email: string | null
  phoneNumber: string | null
  image: string | null
  role: string | null
  emailVerified: boolean | null
  lastLoginAt: string | null
  createdAt: string | null
}

export async function getVendorReservations(
  vendorId: string,
  limit = 200
): Promise<VendorReservationDto[]> {
  try {
    const [points, rows] = await Promise.all([
      db
        .select({ id: pointDeVente.id })
        .from(pointDeVente)
        .where(eq(pointDeVente.vendorId, vendorId)),
      db
        .select({
          reservation,
          pointName: pointDeVente.name,
        })
        .from(reservation)
        .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
        .where(eq(reservation.vendorId, vendorId))
        .orderBy(desc(reservation.reservedAt))
        .limit(limit),
    ])

    const ownedPointIds = new Set(points.map((point) => point.id))
    return rows
      .filter((row) => ownedPointIds.has(row.reservation.pointId))
      .map(({ reservation: row, pointName }) => ({
        id: row.id,
        reservationCode: row.reservationCode,
        clientName: row.clientName,
        clientPhone: row.clientPhone,
        pointId: row.pointId,
        pointName,
        brand: row.brand,
        format: row.format,
        quantity: row.quantity,
        amount: row.amount,
        amountType: row.amountType,
        status: row.status,
        reservedAt: isoRequired(row.reservedAt),
        expiresAt: iso(row.expiresAt),
        collectedAt: iso(row.collectedAt),
        cancelledAt: iso(row.cancelledAt),
      }))
  } catch (err) {
    console.error("[vendor-dashboard] getVendorReservations failed:", errorMessage(err))
    throw err
  }
}

export async function getVendorProfile(vendorId: string): Promise<VendorProfileDto | null> {
  try {
    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, vendorId))
      .limit(1)

    if (!row) return null

    return {
      ...row,
      lastLoginAt: iso(row.lastLoginAt),
      createdAt: iso(row.createdAt),
    }
  } catch (err) {
    console.error("[vendor-dashboard] getVendorProfile failed:", errorMessage(err))
    throw err
  }
}

export async function getVendorPointIds(vendorId: string): Promise<string[]> {
  try {
    const rows = await withTransientRetry(async () => {
      return await db
        .select({ id: pointDeVente.id })
        .from(pointDeVente)
        .where(eq(pointDeVente.vendorId, vendorId))
    })

    if (!rows || !Array.isArray(rows)) {
      console.warn("[vendor-dashboard] getVendorPointIds returned null/undefined")
      return []
    }

    return rows.map((row) => row.id)
  } catch (err) {
    console.error("[vendor-dashboard] getVendorPointIds failed:", errorMessage(err))
    throw err
  }
}

export async function reservationBelongsToVendor(
  reservationId: string,
  vendorId: string
): Promise<boolean> {
  try {
    const pointIds = await getVendorPointIds(vendorId)
    const conditions = [eq(reservation.id, reservationId), eq(reservation.vendorId, vendorId)]
    if (pointIds.length > 0) {
      conditions.push(inArray(reservation.pointId, pointIds))
    }
    const [row] = await db
      .select({ id: reservation.id })
      .from(reservation)
      .where(and(...conditions))
      .limit(1)
    return Boolean(row)
  } catch (err) {
    console.error("[vendor-dashboard] reservationBelongsToVendor failed:", errorMessage(err))
    throw err
  }
}
