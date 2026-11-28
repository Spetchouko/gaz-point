import { NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  pointDeVente,
  disponibilite,
  reservation,
  brand,
  pointDeVenteBouteille,
  adminAction,
} from "@/db/schema"
import {
  count,
  eq,
  and,
  gte,
  lt,
  desc,
  sql,
  inArray,
} from "drizzle-orm"
import { PgTable } from "drizzle-orm/pg-core"
import { requireModuleApi } from "@/lib/session"
import { serverCache, cacheKeys, cacheTags } from "@/lib/server-cache"

/**
 * API d'agrégation du tableau de bord administrateur « Vue d'ensemble ».
 *
 * Protégée : réservée aux administrateurs (requireAdmin).
 * Optimisée : utilise des requêtes SQL agrégées uniques au lieu de boucles par jour.
 * Cache serveur : 60s TTL avec invalidation par tags.
 */
function startOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
function endOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

interface PeriodBounds {
  from: Date
  to: Date
  previousFrom: Date
  previousTo: Date
  label: string
  days: number
}

function resolvePeriod(
  period: string | null,
  fromRaw: string | null,
  toRaw: string | null,
): PeriodBounds {
  const now = new Date()
  let rangeFrom: Date
  let rangeTo: Date
  let label: string
  let days: number

  if (period === "custom" && fromRaw && toRaw) {
    rangeFrom = startOfDayLocal(new Date(fromRaw))
    rangeTo = endOfDayLocal(new Date(toRaw))
    days = Math.ceil((rangeTo.getTime() - rangeFrom.getTime()) / 86_400_000) + 1
    label = "Période personnalisée"
  } else if (period === "year") {
    rangeFrom = new Date(now.getFullYear(), 0, 1)
    rangeTo = new Date(now.getTime() + 1000)
    days = Math.ceil((rangeTo.getTime() - rangeFrom.getTime()) / 86_400_000) + 1
    label = "Cette année"
  } else {
    days = period === "today" ? 1 : period === "7" ? 7 : period === "90" ? 90 : 30
    rangeFrom = startOfDayLocal(new Date(now.getTime() - (days - 1) * 86_400_000))
    rangeTo = new Date(now.getTime() + 1000)
    label =
      period === "today"
        ? "Aujourd'hui"
        : period === "7"
          ? "7 derniers jours"
          : period === "90"
            ? "90 derniers jours"
            : "30 derniers jours"
  }

  const durationMs = rangeTo.getTime() - rangeFrom.getTime()
  const previousFrom = new Date(rangeFrom.getTime() - durationMs)
  const previousTo = new Date(rangeFrom.getTime())

  return { from: rangeFrom, to: rangeTo, previousFrom, previousTo, label, days: Math.min(days, 90) }
}

async function countWhere(table: PgTable, where?: any): Promise<number> {
  // Use type assertion to work around Drizzle type inference issue
  const query = db.select({ value: count().as('value') }).from(table) as any
  if (where) query.where(where)
  const result = await query
  return Number(result[0]?.value ?? 0)
}

function inPeriod(column: any, from: Date, to: Date) {
  return and(gte(column, from), lt(column, to))
}

type Trend = "up" | "down" | "neutral" | null

function computeChange(current: number, previous: number): { change: number | null; trend: Trend } {
  if (previous === 0) return { change: null, trend: null }
  const change = Math.round(((current - previous) / previous) * 100)
  if (change > 0) return { change, trend: "up" }
  if (change < 0) return { change, trend: "down" }
  return { change: 0, trend: "neutral" }
}

/**
 * Requête unique pour obtenir les inscriptions par jour (clients + vendeurs).
 * Remplace N requêtes par une seule requête GROUP BY.
 */
async function getInscriptionsChart(from: Date, to: Date, days: number) {
  const rows = await db
    .select({
      date: sql<string>`DATE(${user.createdAt})`,
      role: user.role,
      count: count(),
    })
    .from(user)
    .where(and(gte(user.createdAt, from), lt(user.createdAt, to)))
    .groupBy(sql`DATE(${user.createdAt})`, user.role)

  // Build map for O(1) lookup
  const map = new Map<string, { clients: number; vendors: number }>()
  for (const row of rows) {
    const key = row.date
    const entry = map.get(key) ?? { clients: 0, vendors: 0 }
    if (row.role === "client") entry.clients = Number(row.count)
    else if (row.role === "vendor") entry.vendors = Number(row.count)
    map.set(key, entry)
  }

  // Generate continuous date series
  const result: { date: string; clients: number; vendors: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86_400_000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const entry = map.get(key)
    result.push({ date: key, clients: entry?.clients ?? 0, vendors: entry?.vendors ?? 0 })
  }
  return result
}

/**
 * Requête unique pour l'évolution des points de vente par jour.
 */
async function getPointsEvolutionChart(from: Date, to: Date, days: number) {
  const rows = await db
    .select({
      date: sql<string>`DATE(${pointDeVente.createdAt})`,
      count: count(),
    })
    .from(pointDeVente)
    .where(and(gte(pointDeVente.createdAt, from), lt(pointDeVente.createdAt, to)))
    .groupBy(sql`DATE(${pointDeVente.createdAt})`)

  const map = new Map<string, number>()
  for (const row of rows) map.set(row.date, Number(row.count))

  const result: { date: string; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86_400_000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    result.push({ date: key, count: map.get(key) ?? 0 })
  }
  return result
}

/**
 * Requête unique pour les disponibilités par jour (publiées vs expirées).
 */
async function getDisponibilitesChart(from: Date, to: Date, days: number) {
  const rows = await db
    .select({
      date: sql<string>`DATE(${disponibilite.createdAt})`,
      status: disponibilite.status,
      count: count(),
    })
    .from(disponibilite)
    .where(and(gte(disponibilite.createdAt, from), lt(disponibilite.createdAt, to)))
    .groupBy(sql`DATE(${disponibilite.createdAt})`, disponibilite.status)

  const map = new Map<string, { published: number; expired: number }>()
  for (const row of rows) {
    const key = row.date
    const entry = map.get(key) ?? { published: 0, expired: 0 }
    if (row.status === "disponible") entry.published = Number(row.count)
    else if (row.status === "indisponible") entry.expired = Number(row.count)
    map.set(key, entry)
  }

  const result: { date: string; published: number; expired: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86_400_000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const entry = map.get(key)
    result.push({ date: key, published: entry?.published ?? 0, expired: entry?.expired ?? 0 })
  }
  return result
}

/**
 * Requête unique pour l'activité des réservations par jour.
 */
async function getReservationsChart(from: Date, to: Date, days: number) {
  const rows = await db
    .select({
      date: sql<string>`DATE(${reservation.createdAt})`,
      status: reservation.status,
      count: count(),
    })
    .from(reservation)
    .where(and(gte(reservation.createdAt, from), lt(reservation.createdAt, to)))
    .groupBy(sql`DATE(${reservation.createdAt})`, reservation.status)

  const map = new Map<string, { received: number; confirmed: number; pending: number; cancelled: number }>()
  for (const row of rows) {
    const key = row.date
    const entry = map.get(key) ?? { received: 0, confirmed: 0, pending: 0, cancelled: 0 }
    entry.received += Number(row.count)
    if (row.status === "confirmed") entry.confirmed = Number(row.count)
    else if (row.status === "pending") entry.pending = Number(row.count)
    else if (row.status === "cancelled") entry.cancelled = Number(row.count)
    map.set(key, entry)
  }

  const result: { date: string; received: number; confirmed: number; pending: number; cancelled: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86_400_000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const entry = map.get(key)
    result.push({
      date: key,
      received: entry?.received ?? 0,
      confirmed: entry?.confirmed ?? 0,
      pending: entry?.pending ?? 0,
      cancelled: entry?.cancelled ?? 0,
    })
  }
  return result
}

export async function GET(req: Request) {
  try {
    const staff = await requireModuleApi("statistiques")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") ?? "30"
    const fromRaw = searchParams.get("from")
    const toRaw = searchParams.get("to")

    const bounds = resolvePeriod(period, fromRaw, toRaw)
    const { from, to, previousFrom, previousTo, label, days } = bounds

    const whereCurrent = inPeriod(user.createdAt, from, to)
    const wherePrevious = inPeriod(user.createdAt, previousFrom, previousTo)

    const cacheKey = cacheKeys.adminDashboard(period)

    // Try cache first
    const cached = serverCache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true, generatedAt: new Date().toISOString() })
    }

    // ============================================================
    // KPI : UTILISATEURS (parallélisés)
    // ============================================================

    const [
      totalClients,
      totalVendors,
      totalAdmins,
      activeVendors,
      newClientsCurrent,
      newClientsPrevious,
      newVendorsCurrent,
      newVendorsPrevious,
      newActiveVendorsCurrent,
      newActiveVendorsPrevious,
    ] = await Promise.all([
      countWhere(user, eq(user.role, "client")),
      countWhere(user, eq(user.role, "vendor")),
      countWhere(user, eq(user.role, "admin")),
      countWhere(user, and(eq(user.role, "vendor"), eq(user.isActive, true))),
      countWhere(user, and(eq(user.role, "client"), whereCurrent)),
      countWhere(user, and(eq(user.role, "client"), wherePrevious)),
      countWhere(user, and(eq(user.role, "vendor"), whereCurrent)),
      countWhere(user, and(eq(user.role, "vendor"), wherePrevious)),
      countWhere(user, and(eq(user.role, "vendor"), eq(user.isActive, true), whereCurrent)),
      countWhere(user, and(eq(user.role, "vendor"), eq(user.isActive, true), wherePrevious)),
    ])

    const clientsChange = computeChange(newClientsCurrent, newClientsPrevious)
    const vendorsChange = computeChange(newVendorsCurrent, newVendorsPrevious)
    const activeVendorsChange = computeChange(newActiveVendorsCurrent, newActiveVendorsPrevious)

    // ============================================================
    // KPI : POINTS DE VENTE
    // ============================================================

    const [totalPoints, pointsCurrent, pointsPrevious] = await Promise.all([
      countWhere(pointDeVente, undefined),
      countWhere(pointDeVente, inPeriod(pointDeVente.createdAt, from, to)),
      countWhere(pointDeVente, inPeriod(pointDeVente.createdAt, previousFrom, previousTo)),
    ])
    const pointsChange = computeChange(pointsCurrent, pointsPrevious)

    // ============================================================
    // KPI : DISPONIBILITÉS
    // ============================================================

    const [totalDispos, activeDispos, expiredDispos, disposPublishedCurrent, disposPublishedPrevious] =
      await Promise.all([
        countWhere(disponibilite, undefined),
        countWhere(disponibilite, eq(disponibilite.status, "disponible")),
        countWhere(disponibilite, eq(disponibilite.status, "indisponible")),
        countWhere(disponibilite, and(eq(disponibilite.status, "disponible"), inPeriod(disponibilite.createdAt, from, to))),
        countWhere(disponibilite, and(eq(disponibilite.status, "disponible"), inPeriod(disponibilite.createdAt, previousFrom, previousTo))),
      ])
    const disposChange = computeChange(disposPublishedCurrent, disposPublishedPrevious)

    // ============================================================
    // KPI : RÉSERVATIONS (parallélisés)
    // ============================================================

    const [
      totalReservations,
      pendingReservations,
      confirmedReservations,
      cancelledReservations,
      reservationsCurrent,
      reservationsPrevious,
      pendingCurrent,
      pendingPrevious,
      confirmedCurrent,
      confirmedPrevious,
      cancelledCurrent,
      cancelledPrevious,
    ] = await Promise.all([
      countWhere(reservation, undefined),
      countWhere(reservation, eq(reservation.status, "pending")),
      countWhere(reservation, eq(reservation.status, "confirmed")),
      countWhere(reservation, eq(reservation.status, "cancelled")),
      countWhere(reservation, inPeriod(reservation.createdAt, from, to)),
      countWhere(reservation, inPeriod(reservation.createdAt, previousFrom, previousTo)),
      countWhere(reservation, and(eq(reservation.status, "pending"), inPeriod(reservation.createdAt, from, to))),
      countWhere(reservation, and(eq(reservation.status, "pending"), inPeriod(reservation.createdAt, previousFrom, previousTo))),
      countWhere(reservation, and(eq(reservation.status, "confirmed"), inPeriod(reservation.createdAt, from, to))),
      countWhere(reservation, and(eq(reservation.status, "confirmed"), inPeriod(reservation.createdAt, previousFrom, previousTo))),
      countWhere(reservation, and(eq(reservation.status, "cancelled"), inPeriod(reservation.createdAt, from, to))),
      countWhere(reservation, and(eq(reservation.status, "cancelled"), inPeriod(reservation.createdAt, previousFrom, previousTo))),
    ])

    const reservationsChange = computeChange(reservationsCurrent, reservationsPrevious)
    const pendingChange = computeChange(pendingCurrent, pendingPrevious)
    const confirmedChange = computeChange(confirmedCurrent, confirmedPrevious)
    const cancelledChange = computeChange(cancelledCurrent, cancelledPrevious)

    // ============================================================
    // GRAPHIQUES : Requêtes uniques GROUP BY au lieu de boucles
    // ============================================================

    const [
      inscriptionsChart,
      pointsEvolution,
      geographicRows,
      disponibilitesChart,
      reservationsChart,
      marquesRows,
      recentUsers,
      recentPoints,
      recentDispos,
      recentReservations,
      recentAdminActions,
    ] = await Promise.all([
      getInscriptionsChart(from, to, days),
      getPointsEvolutionChart(from, to, days),
      db
        .select({
          district: pointDeVente.district,
          count: count(),
        })
        .from(pointDeVente)
        .groupBy(pointDeVente.district)
        .orderBy(desc(count()))
        .limit(15),
      getDisponibilitesChart(from, to, days),
      getReservationsChart(from, to, days),
      db
        .select({
          name: brand.name,
          points: sql<number>`COUNT(DISTINCT ${pointDeVenteBouteille.pointDeVenteId})::int`,
        })
        .from(pointDeVenteBouteille)
        .innerJoin(brand, eq(brand.id, pointDeVenteBouteille.brandId))
        .groupBy(brand.name)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${pointDeVenteBouteille.pointDeVenteId})`))
        .limit(10),
      db
        .select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
        .from(user)
        .where(whereCurrent)
        .orderBy(desc(user.createdAt))
        .limit(12),
      db
        .select({ id: pointDeVente.id, name: pointDeVente.name, vendorId: pointDeVente.vendorId, createdAt: pointDeVente.createdAt })
        .from(pointDeVente)
        .where(inPeriod(pointDeVente.createdAt, from, to))
        .orderBy(desc(pointDeVente.createdAt))
        .limit(12),
      db
        .select({ id: disponibilite.id, brand: disponibilite.brand, pointId: disponibilite.pointId, status: disponibilite.status, createdAt: disponibilite.createdAt })
        .from(disponibilite)
        .where(inPeriod(disponibilite.createdAt, from, to))
        .orderBy(desc(disponibilite.createdAt))
        .limit(12),
      db
        .select({ id: reservation.id, clientName: reservation.clientName, status: reservation.status, createdAt: reservation.createdAt, cancelledAt: reservation.cancelledAt })
        .from(reservation)
        .where(and(gte(reservation.createdAt, from), lt(reservation.createdAt, to)))
        .orderBy(desc(reservation.createdAt))
        .limit(12),
      db
        .select({ id: adminAction.id, action: adminAction.action, targetType: adminAction.targetType, targetId: adminAction.targetId, details: adminAction.details, adminId: adminAction.adminId, createdAt: adminAction.createdAt })
        .from(adminAction)
        .where(and(eq(adminAction.action, "update"), eq(adminAction.targetType, "user"), inPeriod(adminAction.createdAt, from, to)))
        .orderBy(desc(adminAction.createdAt))
        .limit(12),
    ])

    const geographic = geographicRows.map((r) => ({ district: r.district ?? "Non renseigné", count: Number(r.count) }))
    const marques = marquesRows.map((r) => ({ name: r.name, points: Number(r.points) }))

    // Résoudre les noms d'utilisateurs liés
    const relatedUserIds = new Set<string>()
    for (const p of recentPoints) if (p.vendorId) relatedUserIds.add(p.vendorId)
    for (const a of recentAdminActions) if (a.adminId) relatedUserIds.add(a.adminId)

    const relatedUsers = relatedUserIds.size > 0
      ? await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(inArray(user.id, Array.from(relatedUserIds)))
      : []

    const userById = new Map(
      relatedUsers.map((u) => [u.id, { name: u.name ?? "", email: u.email ?? "" }]),
    )

    type ActivityItem = {
      id: string
      type: "signup" | "point_created" | "disponibilite_published" | "reservation_new" | "reservation_confirmed" | "reservation_cancelled" | "account_modified"
      title: string
      subtitle: string
      userName: string
      userEmail?: string
      createdAt: string
      link?: string
    }

    const activities: ActivityItem[] = []

    for (const u of recentUsers) {
      const roleLabel = u.role === "vendor" ? "vendeur" : u.role === "admin" ? "administrateur" : "client"
      activities.push({
        id: `signup-${u.id}`,
        type: "signup",
        title: `Nouvelle inscription ${roleLabel}`,
        subtitle: u.email ?? "",
        userName: u.name,
        userEmail: u.email,
        createdAt: u.createdAt.toISOString(),
        link: "/dashboard/admin/utilisateurs",
      })
    }

    for (const p of recentPoints) {
      const owner = userById.get(p.vendorId ?? "")
      activities.push({
        id: `point-${p.id}`,
        type: "point_created",
        title: "Nouveau point de vente",
        subtitle: p.name,
        userName: owner ? owner.name : "Vendeur",
        userEmail: owner ? owner.email : undefined,
        createdAt: p.createdAt.toISOString(),
        link: "/dashboard/admin/points-de-vente",
      })
    }

    for (const d of recentDispos) {
      activities.push({
        id: `dispo-${d.id}`,
        type: "disponibilite_published",
        title: "Nouvelle disponibilité publiée",
        subtitle: `${d.brand ?? "Gaz"} — ${d.status}`,
        userName: "Vendeur",
        createdAt: d.createdAt.toISOString(),
        link: "/dashboard/admin/disponibilites",
      })
    }

    for (const r of recentReservations) {
      const isCancelled = r.status === "cancelled" || r.cancelledAt !== null
      activities.push({
        id: `reservation-${r.id}`,
        type: isCancelled ? "reservation_cancelled" : "reservation_new",
        title: isCancelled ? "Réservation annulée" : "Nouvelle réservation",
        subtitle: `${r.clientName} — ${r.status}`,
        userName: r.clientName,
        createdAt: r.createdAt.toISOString(),
        link: "/dashboard/admin/reservations",
      })
    }

    for (const a of recentAdminActions) {
      const actor = userById.get(a.adminId ?? "")
      activities.push({
        id: `action-${a.id}`,
        type: "account_modified",
        title: "Modification d'un compte utilisateur",
        subtitle: a.details ?? a.targetId ?? "",
        userName: actor ? actor.name : "Administrateur",
        userEmail: actor ? actor.email : undefined,
        createdAt: a.createdAt.toISOString(),
        link: "/dashboard/admin/utilisateurs",
      })
    }

    activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const recentActivity = activities.slice(0, 20)

    const empty =
      totalClients === 0 &&
      totalVendors === 0 &&
      totalPoints === 0 &&
      totalDispos === 0 &&
      totalReservations === 0 &&
      marques.length === 0 &&
      geographic.length === 0

    const response = {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        previousFrom: previousFrom.toISOString(),
        previousTo: previousTo.toISOString(),
        label: bounds.label,
      },
      kpis: [
        { id: "clients", title: "Clients", label: "Utilisateurs inscrits", value: totalClients, previous: newClientsPrevious, ...clientsChange, trendLabel: "nouveaux inscrits", link: "/dashboard/admin/utilisateurs", icon: "Users" },
        { id: "vendors", title: "Vendeurs", label: "Comptes vendeurs", value: totalVendors, previous: newVendorsPrevious, ...vendorsChange, trendLabel: "nouvelles inscriptions", link: "/dashboard/admin/vendeurs", icon: "Store" },
        { id: "activeVendors", title: "Vendeurs actifs", label: "Comptes vendeurs actifs", value: activeVendors, previous: newActiveVendorsPrevious, ...activeVendorsChange, trendLabel: "vendeurs actifs", link: "/dashboard/admin/vendeurs", icon: "CheckCircle2" },
        { id: "points", title: "Points de vente", label: "Dépôts enregistrés", value: totalPoints, previous: pointsPrevious, ...pointsChange, trendLabel: "points créés", link: "/dashboard/admin/points-de-vente", icon: "Package" },
        { id: "disponibilites", title: "Disponibilités", label: "Publiées actuellement", value: activeDispos, previous: disposPublishedPrevious, ...disposChange, trendLabel: "publiées", link: "/dashboard/admin/disponibilites", icon: "Clock" },
        { id: "reservations", title: "Réservations", label: "Toutes les réservations", value: totalReservations, previous: reservationsPrevious, ...reservationsChange, trendLabel: "nouvelles réservations", link: "/dashboard/admin/reservations", icon: "Calendar" },
        { id: "reservationsPending", title: "En attente", label: "Réservations à valider", value: pendingReservations, previous: pendingPrevious, ...pendingChange, trendLabel: "en attente", link: "/dashboard/admin/reservations?status=pending", icon: "Clock" },
        { id: "reservationsConfirmed", title: "Confirmées", label: "Réservations confirmées", value: confirmedReservations, previous: confirmedPrevious, ...confirmedChange, trendLabel: "confirmées", link: "/dashboard/admin/reservations?status=confirmed", icon: "CheckCircle2" },
        { id: "reservationsCancelled", title: "Annulées", label: "Réservations annulées", value: cancelledReservations, previous: cancelledPrevious, ...cancelledChange, trendLabel: "annulées", link: "/dashboard/admin/reservations?status=cancelled", icon: "AlertCircle" },
      ],
      charts: {
        inscriptions: inscriptionsChart,
        pointsEvolution,
        geographic,
        disponibilites: disponibilitesChart,
        reservations: reservationsChart,
        utilisateurs: [
          { name: "Clients", count: totalClients },
          { name: "Vendeurs", count: totalVendors },
          { name: "Administrateurs", count: totalAdmins },
        ],
        marques,
      },
      recentActivity,
      expiredDispos,
      empty,
      generatedAt: new Date().toISOString(),
    }

    // Cache the response
    serverCache.set(cacheKey, response, { ttlMs: 60_000, tags: [cacheTags.admin] })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[admin/dashboard] error", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des statistiques" }, { status: 500 })
  }
}