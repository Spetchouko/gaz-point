import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  reservation,
  pointDeVente,
  disponibilite,
  trafficEvent,
} from "@/db/schema"
import { count, eq, and, gte, lt, desc, sql } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

function startOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
function endOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export async function GET(req: NextRequest) {
  try {
    const staff = await requireModuleApi("statistiques")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const fromRaw = searchParams.get("from")
    const toRaw = searchParams.get("to")

    const now = new Date()
    // Par défaut : mois en cours
    let rangeFrom: Date, rangeTo: Date
    if (fromRaw && toRaw) {
      rangeFrom = startOfDayLocal(new Date(fromRaw))
      rangeTo = endOfDayLocal(new Date(toRaw))
    } else {
      rangeFrom = new Date(now.getFullYear(), now.getMonth(), 1)
      rangeTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    const whereUsers = and(gte(user.createdAt, rangeFrom), lt(user.createdAt, rangeTo))
    const whereReservations = and(
      gte(reservation.reservedAt, rangeFrom),
      lt(reservation.reservedAt, rangeTo)
    )
    const wherePoints = and(
      gte(pointDeVente.createdAt, rangeFrom),
      lt(pointDeVente.createdAt, rangeTo)
    )
    const whereDispos = and(
      gte(disponibilite.createdAt, rangeFrom),
      lt(disponibilite.createdAt, rangeTo)
    )

    // Comptes utilisateurs (totaux globaux) — parallélisés pour réduire les
    // allers-retours Neon (17 requêtes COUNT lancées en une seule ronde).
    const [
      totalUsers,
      totalClients,
      totalVendors,
      totalAdmins,
      totalCollaborateurs,
      activeUsers,
      newUsersPeriod,
      newVendorsPeriod,
      newCollaborateursPeriod,
      totalPoints,
      activePoints,
      pointsCreatedPeriod,
      totalDispos,
      activeDispos,
      disposPublishedPeriod,
      totalReservations,
      pendingReservations,
      confirmedReservations,
      collectedReservations,
      cancelledReservations,
      monthReservations,
    ] = await Promise.all([
      db.select({ count: count() }).from(user),
      db.select({ count: count() }).from(user).where(eq(user.role, "client")),
      db.select({ count: count() }).from(user).where(eq(user.role, "vendor")),
      db.select({ count: count() }).from(user).where(eq(user.role, "admin")),
      db
        .select({ count: count() })
        .from(user)
        .where(eq(user.role, "collaborateur")),
      db.select({ count: count() }).from(user).where(eq(user.isActive, true)),
      db.select({ count: count() }).from(user).where(whereUsers),
      db
        .select({ count: count() })
        .from(user)
        .where(and(eq(user.role, "vendor"), whereUsers)),
      db
        .select({ count: count() })
        .from(user)
        .where(and(eq(user.role, "collaborateur"), whereUsers)),
      db.select({ count: count() }).from(pointDeVente),
      db
        .select({ count: count() })
        .from(pointDeVente)
        .where(eq(pointDeVente.isActive, true)),
      db
        .select({ count: count() })
        .from(pointDeVente)
        .where(wherePoints),
      db.select({ count: count() }).from(disponibilite),
      db
        .select({ count: count() })
        .from(disponibilite)
        .where(eq(disponibilite.status, "disponible")),
      db
        .select({ count: count() })
        .from(disponibilite)
        .where(whereDispos),
      db.select({ count: count() }).from(reservation),
      db
        .select({ count: count() })
        .from(reservation)
        .where(eq(reservation.status, "pending")),
      db
        .select({ count: count() })
        .from(reservation)
        .where(eq(reservation.status, "confirmed")),
      db
        .select({ count: count() })
        .from(reservation)
        .where(eq(reservation.status, "collected")),
      db
        .select({ count: count() })
        .from(reservation)
        .where(eq(reservation.status, "cancelled")),
      db
        .select({ count: count() })
        .from(reservation)
        .where(whereReservations),
    ])

    // Visiteurs uniques (événements de trafic réels)
    const uniqueVisitorsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT COALESCE(${trafficEvent.sessionId}, ${trafficEvent.userId}))`,
      })
      .from(trafficEvent)
      .where(and(eq(trafficEvent.eventType, "signin")))
    const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count ?? 0)

    // Revenu réel : réservations confirmées et collectées (paiements encaissés)
    // On exclut les statuts pending, cancelled et tout autre statut non encaissé
    const confirmedRevenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${reservation.amount}), 0)`,
      })
      .from(reservation)
      .where(
        sql`${reservation.status} IN ('confirmed', 'collected')`
      )
    const confirmedRevenue = Number(confirmedRevenueResult[0]?.total ?? 0)

    // Réservations par jour dans la période (pour graphique)
    const reservationsByDayRows = await db
      .select({
        day: sql`DATE(${reservation.reservedAt})`,
        count: count(),
      })
      .from(reservation)
      .where(whereReservations)
      .groupBy(sql`DATE(${reservation.reservedAt})`)
      .orderBy(desc(sql`DATE(${reservation.reservedAt})`))

    // Utilisateurs par jour dans la période
    const usersByDayRows = await db
      .select({
        day: sql`DATE(${user.createdAt})`,
        count: count(),
      })
      .from(user)
      .where(whereUsers)
      .groupBy(sql`DATE(${user.createdAt})`)
      .orderBy(desc(sql`DATE(${user.createdAt})`))

    return NextResponse.json({
      users: {
        total: Number(totalUsers.count),
        clients: Number(totalClients.count),
        vendors: Number(totalVendors.count),
        admins: Number(totalAdmins.count),
        collaborateurs: Number(totalCollaborateurs.count),
        active: Number(activeUsers.count),
        newUsersPeriod: Number(newUsersPeriod.count),
        newVendorsPeriod: Number(newVendorsPeriod.count),
        newCollaborateursPeriod: Number(newCollaborateursPeriod.count),
      },
      points: {
        total: Number(totalPoints.count),
        active: Number(activePoints.count),
        createdPeriod: Number(pointsCreatedPeriod.count),
      },
      disponibilites: {
        total: Number(totalDispos.count),
        active: Number(activeDispos.count),
        publishedPeriod: Number(disposPublishedPeriod.count),
      },
      reservations: {
        total: Number(totalReservations.count),
        pending: Number(pendingReservations.count),
        confirmed: Number(confirmedReservations.count),
        collected: Number(collectedReservations.count),
        cancelled: Number(cancelledReservations.count),
        month: Number(monthReservations.count),
      },
      visitors: {
        unique: uniqueVisitors,
      },
      revenue: {
        confirmed: confirmedRevenue,
      },
      period: {
        from: rangeFrom.toISOString(),
        to: rangeTo.toISOString(),
      },
      charts: {
        reservationsByDay: reservationsByDayRows.map((r) => ({
          date: String(r.day),
          count: Number(r.count),
        })),
        usersByDay: usersByDayRows.map((r) => ({
          date: String(r.day),
          count: Number(r.count),
        })),
      },
    })
  } catch (error) {
    console.error("[admin/overview] error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}
