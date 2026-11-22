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
import { toAvisMine } from "@/lib/avis-server"
import type { AvisMine } from "@/lib/avis-shared"

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
export type VendorOverviewData = {
  depot: VendorDepotDto | null
  stats: {
    depotCount: number
    activeAvailabilityCount: number
    reservationCount: number
  }
  activities: any[] // VendorActivityDto[]
  hasAnyData: boolean
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
): Promise<{ id: string; pointName: string; district: string; address: string; phone: string | null; brands: string[]; inventory: any[]; status: string; pointDeVenteId: string | null; createdAt: string } | null> {
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

  return row ? (row as any) : null
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
  const rows = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      pointName: pointDeVente.name,
      brand: disponibilite.brand,
      format: disponibilite.format,
      status: disponibilite.status,
      effectiveStatus:
        // Simulate effectiveStatus logic: expired or not disponible => indisponible
        `${disponibilite.status} ${disponibilite.expiresAt}`.length > 0
          ? `${disponibilite.status}`
          : "disponible",
      quantity: disponibilite.quantity,
      reservedQuantity: disponibilite.reservedQuantity,
      availableQuantity:
        disponibilite.quantity != null
          ? Math.max(0, disponibilite.quantity - disponibilite.reservedQuantity)
          : null,
      price: disponibilite.price,
      note: disponibilite.note,
      phone: disponibilite.phone,
      expiresAt: disponibilite.expiresAt ? disponibilite.expiresAt.toISOString() : null,
      createdAt: disponibilite.createdAt.toISOString(),
      updatedAt: disponibilite.updatedAt.toISOString(),
    })
    .from(disponibilite)
    .innerJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
    .where(eq(pointDeVente.vendorId, vendorId))
    .orderBy(desc(disponibilite.createdAt))

  return rows
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
  const [row] = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      address: pointDeVente.address,
      phone: pointDeVente.phone,
      brands: pointDeVente.brands,
      formats: pointDeVente.formats,
      deliveryEnabled: pointDeVente.deliveryEnabled,
      deliveryFee: pointDeVente.deliveryFee,
      exchangeEnabled: pointDeVente.exchangeEnabled,
      exchangeFee: pointDeVente.exchangeFee,
      exchangeBrands: pointDeVente.exchangeBrands,
      exchangeFormats: pointDeVente.exchangeFormats,
      gasSaleEnabled: pointDeVente.gasSaleEnabled,
      gasSaleFee: pointDeVente.gasSaleFee,
      gasSaleBrands: pointDeVente.gasSaleBrands,
      gasSaleFormats: pointDeVente.gasSaleFormats,
      isActive: pointDeVente.isActive,
      createdAt: pointDeVente.createdAt,
      updatedAt: pointDeVente.updatedAt,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, vendorId))
    .limit(1)

  return row ? (row as VendorDepotDto) : null
}

// Get all depots for a vendor
export async function getVendorDepots(
  vendorId: string
): Promise<VendorDepotDto[]> {
  const rows = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      address: pointDeVente.address,
      phone: pointDeVente.phone,
      brands: pointDeVente.brands,
      formats: pointDeVente.formats,
      deliveryEnabled: pointDeVente.deliveryEnabled,
      deliveryFee: pointDeVente.deliveryFee,
      exchangeEnabled: pointDeVente.exchangeEnabled,
      exchangeFee: pointDeVente.exchangeFee,
      exchangeBrands: pointDeVente.exchangeBrands,
      exchangeFormats: pointDeVente.exchangeFormats,
      gasSaleEnabled: pointDeVente.gasSaleEnabled,
      gasSaleFee: pointDeVente.gasSaleFee,
      gasSaleBrands: pointDeVente.gasSaleBrands,
      gasSaleFormats: pointDeVente.gasSaleFormats,
      isActive: pointDeVente.isActive,
      createdAt: pointDeVente.createdAt,
      updatedAt: pointDeVente.updatedAt,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, vendorId))
    .orderBy(desc(pointDeVente.createdAt))

  return rows
}

// Get vendor overview (backward compatible)
export async function getVendorOverview(
  vendorId: string
): Promise<VendorOverviewData> {
  // Récupérer le dépôt principal (s'il existe)
  let depot: VendorDepotDto | null = null
  try {
    const [mainDepot] = await getVendorDepots(vendorId)
    depot = mainDepot ?? null
  } catch (err) {
    console.error("[vendor-dashboard] getVendorDepot failed:", err)
  }

  // Récupérer TOUS les depots du vendeur (nouvelle fonctionnalité)
  let allDepots: VendorDepotDto[] = []
  try {
    allDepots = await getVendorDepots(vendorId)
  } catch (err) {
    console.error("[vendor-dashboard] getVendorDepots failed:", err)
  }

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
    console.error("[vendor-dashboard] active availability count failed:", err)
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
    console.error("[vendor-dashboard] reservation count failed:", err)
  }

  // Activities: last 5 activities (reservations + availabilities)
  let activities: any[] = []
  try {
    const reservations = await db
      .select({
        reservation,
        pointName: pointDeVente.name,
      })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(eq(reservation.vendorId, vendorId))
      .orderBy(desc(reservation.reservedAt))
      .limit(5)

    const availabilities = await db
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
      // Add availabilities
      ...availabilities.slice(0, 5).map((row) => ({
        id: `availability-${row.availability.id}`,
        type: "availability" as const,
        title: `${row.availability.brand ?? "Marque"} ${row.availability.format ?? ""}`.trim(),
        detail: `${row.pointName ?? "Dépôt"} · ${row.availability.effectiveStatus === "disponible" ? "Disponible" : "Indisponible"}`,
        at: row.availability.updatedAt,
        status: row.availability.effectiveStatus,
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5)
  } catch (err) {
    console.error("[vendor-dashboard] activities fetch failed:", err)
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
  const depots = await getVendorDepots(vendorId)

  const totalDepots = depots.length
  const activeDepots = depots.filter((d) => d.isActive).length

  return {
    depots,
    totalDepots,
    activeDepots,
  }
}

// Get vendor review (for avis page)
export async function getVendorReview(
  vendorId: string
): Promise<{ id: string; rating: number | null; status: string; createdAt: string } | null> {
  const [row] = await db
    .select({
      id: avis.id,
      rating: avis.rating,
      status: avis.status,
      createdAt: avis.createdAt,
    })
    .from(avis)
    .where(eq(avis.userId, vendorId))
    .orderBy(desc(avis.createdAt))
    .limit(1)

  return row ? {
    id: row.id,
    rating: row.rating,
    status: row.status,
    createdAt: row.createdAt,
  } : null
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
}

export async function getVendorProfile(vendorId: string): Promise<VendorProfileDto | null> {
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
}

export async function getVendorPointIds(vendorId: string): Promise<string[]> {
  const rows = await db
    .select({ id: pointDeVente.id })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, vendorId))
  return rows.map((row) => row.id)
}

export async function reservationBelongsToVendor(
  reservationId: string,
  vendorId: string
): Promise<boolean> {
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
}
