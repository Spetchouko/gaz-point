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
  exchangeBrands: string[]
  exchangeFormats: string[]
  gasSaleEnabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type VendorOnboardingDto = {
  pointName: string
  district: string
  address: string
  phone: string | null
  brands: string[]
}

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

export type VendorActivityDto = {
  id: string
  type: "reservation" | "availability"
  title: string
  detail: string
  at: string
  status: string | null
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

function iso(value: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function isoRequired(value: Date | string): string {
  return iso(value) ?? new Date(0).toISOString()
}

function toDepotDto(row: typeof pointDeVente.$inferSelect): VendorDepotDto {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    address: row.address,
    phone: row.phone,
    brands: row.brands ?? [],
    formats: row.formats ?? [],
    deliveryEnabled: row.deliveryEnabled,
    deliveryFee: row.deliveryFee,
    exchangeEnabled: row.exchangeEnabled,
    exchangeBrands: row.exchangeBrands ?? [],
    exchangeFormats: row.exchangeFormats ?? [],
    gasSaleEnabled: row.gasSaleEnabled,
    isActive: row.isActive,
    createdAt: isoRequired(row.createdAt),
    updatedAt: isoRequired(row.updatedAt),
  }
}

export async function getVendorDepot(vendorId: string): Promise<VendorDepotDto | null> {
  const [row] = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, vendorId))
    .limit(1)

  return row ? toDepotDto(row) : null
}

export async function getVendorOnboarding(
  vendorId: string
): Promise<VendorOnboardingDto | null> {
  const [row] = await db
    .select({
      pointName: vendorOnboarding.pointName,
      district: vendorOnboarding.district,
      address: vendorOnboarding.address,
      phone: vendorOnboarding.phone,
      brands: vendorOnboarding.brands,
    })
    .from(vendorOnboarding)
    .where(eq(vendorOnboarding.userId, vendorId))
    .limit(1)

  if (!row) return null
  return { ...row, brands: row.brands ?? [] }
}

export async function getVendorAvailabilities(
  vendorId: string
): Promise<VendorAvailabilityDto[]> {
  const rows = await db
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
    .limit(200)

  const now = Date.now()
  return rows.map(({ availability: row, pointName }) => {
    const expired = row.expiresAt != null && row.expiresAt.getTime() < now
    const effectiveStatus =
      expired || row.status !== "disponible" ? "indisponible" : "disponible"

    return {
      id: row.id,
      pointId: row.pointId,
      pointName,
      brand: row.brand,
      format: row.format,
      status: row.status,
      effectiveStatus,
      quantity: row.quantity,
      reservedQuantity: row.reservedQuantity,
      availableQuantity:
        row.quantity != null
          ? Math.max(0, row.quantity - row.reservedQuantity)
          : null,
      price: row.price,
      note: row.note,
      phone: row.phone,
      expiresAt: iso(row.expiresAt),
      createdAt: isoRequired(row.createdAt),
      updatedAt: isoRequired(row.updatedAt),
    }
  })
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

export type VendorOverviewData = {
  depot: VendorDepotDto | null
  stats: {
    depotCount: number
    activeAvailabilityCount: number
    reservationCount: number
  }
  activities: VendorActivityDto[]
  hasAnyData: boolean
}

export async function getVendorOverview(
  vendorId: string
): Promise<VendorOverviewData> {
  // Chaque sous-requête est encapsulée individuellement afin qu'une erreur
  // sur l'une d'elles (ex: indisponibilité temporaire d'une table) ne bloque
  // pas l'intégralité du dashboard vendeur.
  let depot: VendorDepotDto | null = null
  let depotError: Error | null = null
  try {
    depot = await getVendorDepot(vendorId)
  } catch (err) {
    depotError = err instanceof Error ? err : new Error("Erreur inconnue")
    console.error("[vendor-dashboard] getVendorDepot failed:", depotError.message)
  }

  let availabilities: VendorAvailabilityDto[] = []
  let availabilitiesError: Error | null = null
  try {
    availabilities = await getVendorAvailabilities(vendorId)
  } catch (err) {
    availabilitiesError = err instanceof Error ? err : new Error("Erreur inconnue")
    console.error("[vendor-dashboard] getVendorAvailabilities failed:", availabilitiesError.message)
  }

  let reservations = await getVendorReservations(vendorId, 10)
  let reservationsError: Error | null = null
  try {
    reservations = await getVendorReservations(vendorId, 10)
  } catch (err) {
    reservationsError = err instanceof Error ? err : new Error("Erreur inconnue")
    console.error("[vendor-dashboard] getVendorReservations failed:", reservationsError.message)
  }

  let activeCountResult: { value: number }[] = []
  try {
    activeCountResult = await db
      .select({ value: count() })
      .from(disponibilite)
      .where(
        and(
          eq(disponibilite.vendorId, vendorId),
          eq(disponibilite.status, "disponible"),
          or(isNull(disponibilite.expiresAt), gt(disponibilite.expiresAt, new Date()))
        )
      )
  } catch (err) {
    console.error("[vendor-dashboard] active availability count failed:", err)
  }

  let reservationCountResult: { value: number }[] = []
  try {
    reservationCountResult = await db
      .select({ value: count() })
      .from(reservation)
      .where(eq(reservation.vendorId, vendorId))
  } catch (err) {
    console.error("[vendor-dashboard] reservation count failed:", err)
  }

  const activities: VendorActivityDto[] = [
    ...reservations.map((row) => ({
      id: `reservation-${row.id}`,
      type: "reservation" as const,
      title: `Réservation ${row.reservationCode}`,
      detail: `${row.clientName} · ${row.brand} ${row.format}`,
      at: row.reservedAt,
      status: row.status,
    })),
    ...availabilities.slice(0, 10).map((row) => ({
      id: `availability-${row.id}`,
      type: "availability" as const,
      title: `${row.brand ?? "Marque"} ${row.format ?? ""}`.trim(),
      detail: `${row.pointName ?? "Dépôt"} · ${row.effectiveStatus === "disponible" ? "Disponible" : "Indisponible"}`,
      at: row.updatedAt,
      status: row.effectiveStatus,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5)

  // Si la requête critique (dépôt) a échoué, on propage l'erreur pour qu'elle
  // soit affichée côté client, sans masquer le véritable problème.
  if (depotError) {
    throw depotError
  }

  return {
    depot,
    stats: {
      depotCount: depot ? 1 : 0,
      activeAvailabilityCount: activeCountResult[0]?.value ?? 0,
      reservationCount: reservationCountResult[0]?.value ?? 0,
    },
    activities,
    hasAnyData:
      Boolean(depot) || availabilities.length > 0 || reservations.length > 0,
  }
}

export async function getVendorReview(vendorId: string): Promise<AvisMine | null> {
  const [row] = await db
    .select()
    .from(avis)
    .where(eq(avis.userId, vendorId))
    .orderBy(desc(avis.createdAt))
    .limit(1)

  return row ? toAvisMine(row) : null
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
