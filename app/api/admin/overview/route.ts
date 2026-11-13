import { NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  reservation,
  pointDeVente,
  disponibilite,
} from "@/db/schema"
import { count, eq, and, gte, lt } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Comptes utilisateurs
    const [totalUsers] = await db.select({ count: count() }).from(user)
    const [totalClients] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "client"))
    const [totalVendors] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "vendor"))
    const [totalAdmins] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"))
    const [activeUsers] = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.isActive, true))

    // Points de vente
    const [totalPoints] = await db.select({ count: count() }).from(pointDeVente)
    const [activePoints] = await db
      .select({ count: count() })
      .from(pointDeVente)
      .where(eq(pointDeVente.isActive, true))

    // Disponibilités
    const [totalDispos] = await db.select({ count: count() }).from(disponibilite)
    const [activeDispos] = await db
      .select({ count: count() })
      .from(disponibilite)
      .where(eq(disponibilite.status, "disponible"))

    // Réservations
    const [totalReservations] = await db
      .select({ count: count() })
      .from(reservation)
    const [pendingReservations] = await db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.status, "pending"))
    const [confirmedReservations] = await db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.status, "confirmed"))
    const [collectedReservations] = await db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.status, "collected"))
    const [cancelledReservations] = await db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.status, "cancelled"))

    // Réservations du mois en cours
    const [monthReservations] = await db
      .select({ count: count() })
      .from(reservation)
      .where(
        and(
          gte(reservation.reservedAt, startOfMonth),
          lt(reservation.reservedAt, now)
        )
      )

    return NextResponse.json({
      users: {
        total: Number(totalUsers.count),
        clients: Number(totalClients.count),
        vendors: Number(totalVendors.count),
        admins: Number(totalAdmins.count),
        active: Number(activeUsers.count),
      },
      points: {
        total: Number(totalPoints.count),
        active: Number(activePoints.count),
      },
      disponibilites: {
        total: Number(totalDispos.count),
        active: Number(activeDispos.count),
      },
      reservations: {
        total: Number(totalReservations.count),
        pending: Number(pendingReservations.count),
        confirmed: Number(confirmedReservations.count),
        collected: Number(collectedReservations.count),
        cancelled: Number(cancelledReservations.count),
        month: Number(monthReservations.count),
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
