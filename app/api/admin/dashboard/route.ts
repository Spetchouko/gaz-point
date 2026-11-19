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
} from "drizzle-orm"
import { PgTable } from "drizzle-orm/pg-core"
import { requireModuleApi } from "@/lib/session"

/**
 * API d'agrégation du tableau de bord administrateur « Vue d'ensemble ».
 *
 * Protégée : réservée aux administrateurs (requireAdmin).
 * Toutes les calculations sont faites côté serveur via SQL agrégé. Aucune
 * donnée brute n'est envoyée au navigateur. Aucune donnée fictive n'est
 * générée : si une table est vide, les tableaux/indicateurs sont vides.
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

  if (period === "custom" && fromRaw && toRaw) {
    rangeFrom = startOfDayLocal(new Date(fromRaw))
    rangeTo = endOfDayLocal(new Date(toRaw))
    label = "Période personnalisée"
  } else if (period === "year") {
    rangeFrom = new Date(now.getFullYear(), 0, 1)
    rangeTo = new Date(now.getTime() + 1000)
    label = "Cette année"
  } else {
    const days =
      period === "today" ? 1 : period === "7" ? 7 : period === "90" ? 90 : 30
    rangeFrom = startOfDayLocal(
      new Date(now.getTime() - (days - 1) * 86_400_000),
    )
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

  return { from: rangeFrom, to: rangeTo, previousFrom, previousTo, label }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countWhere(table: PgTable, where?: any): Promise<number> {
  let query = db.select({ count: count() }).from(table)
  if (where) query = query.where(where)
  const result = await query
  return Number(result[0]?.count ?? 0)
}

function inPeriod(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any,
  from: Date,
  to: Date,
) {
  return and(gte(column, from), lt(column, to))
}

type Trend = "up" | "down" | "neutral" | null

function computeChange(current: number, previous: number): {
  change: number | null
  trend: Trend
} {
  if (previous === 0) {
    // Impossible de calculer un pourcentage sur une période vide.
    return { change: current > 0 ? null : null, trend: null }
  }
  const change = Math.round(((current - previous) / previous) * 100)
  if (change > 0) return { change, trend: "up" }
  if (change < 0) return { change, trend: "down" }
  return { change: 0, trend: "neutral" }
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
    const { from, to, previousFrom, previousTo } = bounds

    const whereCurrent = inPeriod(user.createdAt, from, to)
    const wherePrevious = inPeriod(user.createdAt, previousFrom, previousTo)

    // ============================================================
    // KPI : UTILISATEURS
    // ============================================================

    const [totalClients, totalVendors, totalAdmins, activeVendors] =
      await Promise.all([
        countWhere(user, eq(user.role, "client")),
        countWhere(user, eq(user.role, "vendor")),
        countWhere(user, eq(user.role, "admin")),
        countWhere(
          user,
          and(eq(user.role, "vendor"), eq(user.isActive, true)),
        ),
      ])

    const newClientsCurrent = await countWhere(
      user,
      and(eq(user.role, "client"), whereCurrent),
    )
    const newClientsPrevious = await countWhere(
      user,
      and(eq(user.role, "client"), wherePrevious),
    )
    const newVendorsCurrent = await countWhere(
      user,
      and(eq(user.role, "vendor"), whereCurrent),
    )
    const newVendorsPrevious = await countWhere(
      user,
      and(eq(user.role, "vendor"), wherePrevious),
    )
    const newActiveVendorsCurrent = await countWhere(
      user,
      and(eq(user.role, "vendor"), eq(user.isActive, true), whereCurrent),
    )
    const newActiveVendorsPrevious = await countWhere(
      user,
      and(eq(user.role, "vendor"), eq(user.isActive, true), wherePrevious),
    )

    const clientsChange = computeChange(newClientsCurrent, newClientsPrevious)
    const vendorsChange = computeChange(newVendorsCurrent, newVendorsPrevious)
    const activeVendorsChange = computeChange(
      newActiveVendorsCurrent,
      newActiveVendorsPrevious,
    )

    // ============================================================
    // KPI : POINTS DE VENTE
    // ============================================================

    const totalPoints = await countWhere(pointDeVente, undefined)

    const pointsCurrent = await countWhere(
      pointDeVente,
      inPeriod(pointDeVente.createdAt, from, to),
    )
    const pointsPrevious = await countWhere(
      pointDeVente,
      inPeriod(pointDeVente.createdAt, previousFrom, previousTo),
    )
    const pointsChange = computeChange(pointsCurrent, pointsPrevious)

    // ============================================================
    // KPI : DISPONIBILITÉS
    // ============================================================

    const [totalDispos, activeDispos, expiredDispos] = await Promise.all([
      countWhere(disponibilite, undefined),
      countWhere(
        disponibilite,
        eq(disponibilite.status, "disponible"),
      ),
      countWhere(disponibilite, eq(disponibilite.status, "indisponible")),
    ])

    const disposPublishedCurrent = await countWhere(
      disponibilite,
      and(
        eq(disponibilite.status, "disponible"),
        inPeriod(disponibilite.createdAt, from, to),
      ),
    )
    const disposPublishedPrevious = await countWhere(
      disponibilite,
      and(
        eq(disponibilite.status, "disponible"),
        inPeriod(disponibilite.createdAt, previousFrom, previousTo),
      ),
    )
    const disposChange = computeChange(disposPublishedCurrent, disposPublishedPrevious)

    // ============================================================
    // KPI : RÉSERVATIONS
    // ============================================================

    const [
      totalReservations,
      pendingReservations,
      confirmedReservations,
      cancelledReservations,
    ] = await Promise.all([
      countWhere(reservation, undefined),
      countWhere(reservation, eq(reservation.status, "pending")),
      countWhere(reservation, eq(reservation.status, "confirmed")),
      countWhere(reservation, eq(reservation.status, "cancelled")),
    ])

    const reservationsCurrent = await countWhere(
      reservation,
      inPeriod(reservation.createdAt, from, to),
    )
    const reservationsPrevious = await countWhere(
      reservation,
      inPeriod(reservation.createdAt, previousFrom, previousTo),
    )

    const pendingCurrent = await countWhere(
      reservation,
      and(eq(reservation.status, "pending"), inPeriod(reservation.createdAt, from, to)),
    )
    const pendingPrevious = await countWhere(
      reservation,
      and(eq(reservation.status, "pending"), inPeriod(reservation.createdAt, previousFrom, previousTo)),
    )
    const confirmedCurrent = await countWhere(
      reservation,
      and(eq(reservation.status, "confirmed"), inPeriod(reservation.createdAt, from, to)),
    )
    const confirmedPrevious = await countWhere(
      reservation,
      and(eq(reservation.status, "confirmed"), inPeriod(reservation.createdAt, previousFrom, previousTo)),
    )
    const cancelledCurrent = await countWhere(
      reservation,
      and(eq(reservation.status, "cancelled"), inPeriod(reservation.createdAt, from, to)),
    )
    const cancelledPrevious = await countWhere(
      reservation,
      and(eq(reservation.status, "cancelled"), inPeriod(reservation.createdAt, previousFrom, previousTo)),
    )

    const reservationsChange = computeChange(reservationsCurrent, reservationsPrevious)
    const pendingChange = computeChange(pendingCurrent, pendingPrevious)
    const confirmedChange = computeChange(confirmedCurrent, confirmedPrevious)
    const cancelledChange = computeChange(cancelledCurrent, cancelledPrevious)

    // ============================================================
    // GRAPHIQUE A : ÉVOLUTION DES INSCRIPTIONS (par jour)
    // ============================================================

    const inscriptionDays = Math.min(
      Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1,
      90,
    )
    const inscriptionsChart = await Promise.all(
      Array.from({ length: inscriptionDays }, async (_, i) => {
        const d = new Date(from.getTime() + i * 86_400_000)
        const dayEnd = new Date(d.getTime() + 86_400_000)
        const [clients, vendors] = await Promise.all([
          countWhere(
            user,
            and(
              eq(user.role, "client"),
              gte(user.createdAt, d),
              lt(user.createdAt, dayEnd),
            ),
          ),
          countWhere(
            user,
            and(
              eq(user.role, "vendor"),
              gte(user.createdAt, d),
              lt(user.createdAt, dayEnd),
            ),
          ),
        ])
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          clients,
          vendors,
        }
      }),
    )

    // ============================================================
    // GRAPHIQUE B : POINTS DE VENTE (évolution + géographique)
    // ============================================================

    const pointsDays = Math.min(
      Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1,
      90,
    )
    const pointsEvolution = await Promise.all(
      Array.from({ length: pointsDays }, async (_, i) => {
        const d = new Date(from.getTime() + i * 86_400_000)
        const dayEnd = new Date(d.getTime() + 86_400_000)
        const count = await countWhere(
          pointDeVente,
          and(gte(pointDeVente.createdAt, d), lt(pointDeVente.createdAt, dayEnd)),
        )
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          count,
        }
      }),
    )

    const geographicRows = await db
      .select({
        district: pointDeVente.district,
        count: count(),
      })
      .from(pointDeVente)
      .groupBy(pointDeVente.district)
      .orderBy(desc(count()))
      .limit(15)

    const geographic = geographicRows.map((r) => ({
      district: r.district ?? "Non renseigné",
      count: Number(r.count),
    }))

    // ============================================================
    // GRAPHIQUE C : DISPONIBILITÉS (publiées vs expirées/désactivées)
    // ============================================================

    const disposDays = Math.min(
      Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1,
      90,
    )
    const disponibilitesChart = await Promise.all(
      Array.from({ length: disposDays }, async (_, i) => {
        const d = new Date(from.getTime() + i * 86_400_000)
        const dayEnd = new Date(d.getTime() + 86_400_000)
        const [published, expired] = await Promise.all([
          countWhere(
            disponibilite,
            and(
              eq(disponibilite.status, "disponible"),
              gte(disponibilite.createdAt, d),
              lt(disponibilite.createdAt, dayEnd),
            ),
          ),
          countWhere(
            disponibilite,
            and(
              eq(disponibilite.status, "indisponible"),
              gte(disponibilite.createdAt, d),
              lt(disponibilite.createdAt, dayEnd),
            ),
          ),
        ])
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          published,
          expired,
        }
      }),
    )

    // ============================================================
    // GRAPHIQUE D : ACTIVITÉ DES RÉSERVATIONS (par jour)
    // ============================================================

    const reservationsDays = Math.min(
      Math.ceil((to.getTime() - from.getTime()) / 86_400_000) + 1,
      90,
    )
    const reservationsChart = await Promise.all(
      Array.from({ length: reservationsDays }, async (_, i) => {
        const d = new Date(from.getTime() + i * 86_400_000)
        const dayEnd = new Date(d.getTime() + 86_400_000)
        const [received, confirmed, pending, cancelled] = await Promise.all([
          countWhere(
            reservation,
            and(gte(reservation.createdAt, d), lt(reservation.createdAt, dayEnd)),
          ),
          countWhere(
            reservation,
            and(
              eq(reservation.status, "confirmed"),
              gte(reservation.createdAt, d),
              lt(reservation.createdAt, dayEnd),
            ),
          ),
          countWhere(
            reservation,
            and(
              eq(reservation.status, "pending"),
              gte(reservation.createdAt, d),
              lt(reservation.createdAt, dayEnd),
            ),
          ),
          countWhere(
            reservation,
            and(
              eq(reservation.status, "cancelled"),
              gte(reservation.createdAt, d),
              lt(reservation.createdAt, dayEnd),
            ),
          ),
        ])
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          received,
          confirmed,
          pending,
          cancelled,
        }
      }),
    )

    // ============================================================
    // GRAPHIQUE E : RÉPARTITION DES UTILISATEURS (camembert)
    // ============================================================

    const utilisateursChart = [
      { name: "Clients", count: totalClients },
      { name: "Vendeurs", count: totalVendors },
      { name: "Administrateurs", count: totalAdmins },
    ]

    // ============================================================
    // GRAPHIQUE F : MARQUES LES PLUS PROPOSÉES (barres horizontales)
    // ============================================================

    const marquesRows = await db
      .select({
        name: brand.name,
        points: sql<number>`COUNT(DISTINCT ${pointDeVenteBouteille.pointDeVenteId})::int`,
      })
      .from(pointDeVenteBouteille)
      .innerJoin(brand, eq(brand.id, pointDeVenteBouteille.brandId))
      .groupBy(brand.name)
      .orderBy(desc(sql<number>`COUNT(DISTINCT ${pointDeVenteBouteille.pointDeVenteId})`))
      .limit(10)

    const marques = marquesRows.map((r) => ({
      name: r.name,
      points: Number(r.points),
    }))

    // ============================================================
    // ACTIVITÉ RÉCENTE (événements réels, jamais fictifs)
    // ============================================================

    const recentUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereCurrent)
      .orderBy(desc(user.createdAt))
      .limit(12)

    const recentPoints = await db
      .select({
        id: pointDeVente.id,
        name: pointDeVente.name,
        vendorId: pointDeVente.vendorId,
        createdAt: pointDeVente.createdAt,
      })
      .from(pointDeVente)
      .where(inPeriod(pointDeVente.createdAt, from, to))
      .orderBy(desc(pointDeVente.createdAt))
      .limit(12)

    const recentDispos = await db
      .select({
        id: disponibilite.id,
        brand: disponibilite.brand,
        pointId: disponibilite.pointId,
        status: disponibilite.status,
        createdAt: disponibilite.createdAt,
      })
      .from(disponibilite)
      .where(inPeriod(disponibilite.createdAt, from, to))
      .orderBy(desc(disponibilite.createdAt))
      .limit(12)

    const recentReservations = await db
      .select({
        id: reservation.id,
        clientName: reservation.clientName,
        status: reservation.status,
        createdAt: reservation.createdAt,
        cancelledAt: reservation.cancelledAt,
      })
      .from(reservation)
      .where(
        and(
          gte(reservation.createdAt, from),
          lt(reservation.createdAt, to),
        ),
      )
      .orderBy(desc(reservation.createdAt))
      .limit(12)

    const recentAdminActions = await db
      .select({
        id: adminAction.id,
        action: adminAction.action,
        targetType: adminAction.targetType,
        targetId: adminAction.targetId,
        details: adminAction.details,
        adminId: adminAction.adminId,
        createdAt: adminAction.createdAt,
      })
      .from(adminAction)
      .where(
        and(
          eq(adminAction.action, "update"),
          eq(adminAction.targetType, "user"),
          inPeriod(adminAction.createdAt, from, to),
        ),
      )
      .orderBy(desc(adminAction.createdAt))
      .limit(12)

    // Résoudre les noms d'utilisateurs liés (vendeur d'un point, admin d'une action).
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
      type:
        | "signup"
        | "point_created"
        | "disponibilite_published"
        | "reservation_new"
        | "reservation_confirmed"
        | "reservation_cancelled"
        | "account_modified"
      title: string
      subtitle: string
      userName: string
      userEmail?: string
      createdAt: string
      link?: string
    }

    const activities: ActivityItem[] = []

    for (const u of recentUsers) {
      const roleLabel =
        u.role === "vendor" ? "vendeur" : u.role === "admin" ? "administrateur" : "client"
      activities.push({
        id: `signup-${u.id}`,
        type: "signup",
        title: `Nouvelle inscription ${roleLabel}`,
        subtitle: u.email ?? "",
        userName: u.name,
        userEmail: u.email,
        createdAt: u.createdAt.toISOString(),
        link: `/dashboard/admin/utilisateurs`,
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
        link: `/dashboard/admin/points-de-vente`,
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
        link: `/dashboard/admin/disponibilites`,
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
        link: `/dashboard/admin/reservations`,
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
        link: `/dashboard/admin/utilisateurs`,
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

    return NextResponse.json({
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        previousFrom: previousFrom.toISOString(),
        previousTo: previousTo.toISOString(),
        label: bounds.label,
      },
      kpis: [
        {
          id: "clients",
          title: "Clients",
          label: "Utilisateurs inscrits",
          value: totalClients,
          previous: newClientsPrevious,
          ...clientsChange,
          trendLabel: "nouveaux inscrits",
          link: "/dashboard/admin/utilisateurs",
          icon: "Users",
        },
        {
          id: "vendors",
          title: "Vendeurs",
          label: "Comptes vendeurs",
          value: totalVendors,
          previous: newVendorsPrevious,
          ...vendorsChange,
          trendLabel: "nouvelles inscriptions",
          link: "/dashboard/admin/vendeurs",
          icon: "Store",
        },
        {
          id: "activeVendors",
          title: "Vendeurs actifs",
          label: "Comptes vendeurs actifs",
          value: activeVendors,
          previous: newActiveVendorsPrevious,
          ...activeVendorsChange,
          trendLabel: "vendeurs actifs",
          link: "/dashboard/admin/vendeurs",
          icon: "CheckCircle2",
        },
        {
          id: "points",
          title: "Points de vente",
          label: "Dépôts enregistrés",
          value: totalPoints,
          previous: pointsPrevious,
          ...pointsChange,
          trendLabel: "points créés",
          link: "/dashboard/admin/points-de-vente",
          icon: "Package",
        },
        {
          id: "disponibilites",
          title: "Disponibilités",
          label: "Publiées actuellement",
          value: activeDispos,
          previous: disposPublishedPrevious,
          ...disposChange,
          trendLabel: "publiées",
          link: "/dashboard/admin/disponibilites",
          icon: "Clock",
        },
        {
          id: "reservations",
          title: "Réservations",
          label: "Toutes les réservations",
          value: totalReservations,
          previous: reservationsPrevious,
          ...reservationsChange,
          trendLabel: "nouvelles réservations",
          link: "/dashboard/admin/reservations",
          icon: "Calendar",
        },
        {
          id: "reservationsPending",
          title: "En attente",
          label: "Réservations à valider",
          value: pendingReservations,
          previous: pendingPrevious,
          ...pendingChange,
          trendLabel: "en attente",
          link: "/dashboard/admin/reservations?status=pending",
          icon: "Clock",
        },
        {
          id: "reservationsConfirmed",
          title: "Confirmées",
          label: "Réservations confirmées",
          value: confirmedReservations,
          previous: confirmedPrevious,
          ...confirmedChange,
          trendLabel: "confirmées",
          link: "/dashboard/admin/reservations?status=confirmed",
          icon: "CheckCircle2",
        },
        {
          id: "reservationsCancelled",
          title: "Annulées",
          label: "Réservations annulées",
          value: cancelledReservations,
          previous: cancelledPrevious,
          ...cancelledChange,
          trendLabel: "annulées",
          link: "/dashboard/admin/reservations?status=cancelled",
          icon: "AlertCircle",
        },
      ],
      charts: {
        inscriptions: inscriptionsChart,
        pointsEvolution,
        geographic,
        disponibilites: disponibilitesChart,
        reservations: reservationsChart,
        utilisateurs: utilisateursChart,
        marques,
      },
      recentActivity,
      expiredDispos,
      empty,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[admin/dashboard] error", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 },
    )
  }
}
