import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { reservation, pointDeVente } from "@/db/schema";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const rows = await db
      .select({
        id: reservation.id,
        reservationCode: reservation.reservationCode,
        brand: reservation.brand,
        format: reservation.format,
        quantity: reservation.quantity,
        amount: reservation.amount,
        amountType: reservation.amountType,
        status: reservation.status,
        reservedAt: reservation.reservedAt,
        collectedAt: reservation.collectedAt,
        cancelledAt: reservation.cancelledAt,
        pointName: pointDeVente.name,
        pointDistrict: pointDeVente.district,
      })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(eq(reservation.userId, session.user.id))
      .orderBy(desc(reservation.reservedAt))
      .limit(limit);

    // Transform to match the expected interface
    const reservations = rows.map((row) => ({
      id: row.id,
      reservationCode: row.reservationCode,
      brand: row.brand,
      format: row.format,
      quantity: row.quantity,
      amount: row.amount ?? 0,
      amountType: row.amountType ?? "reservation",
      pointName: row.pointName ?? "Point de vente",
      pointDistrict: row.pointDistrict ?? "",
      status: row.status,
      reservedAt: row.reservedAt,
      collectedAt: row.collectedAt,
      cancelledAt: row.cancelledAt,
    }));

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("[GET /api/historique/reservations] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique des réservations" },
      { status: 500 }
    );
  }
}