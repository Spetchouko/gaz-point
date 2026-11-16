import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProUser } from "@/lib/session"

export async function GET() {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const [point] = await db
      .select()
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, user.id))
      .limit(1)

    return NextResponse.json({ point })
  } catch (err) {
    console.error("[depot/mine] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du dépôt" },
      { status: 500 }
    )
  }
}
