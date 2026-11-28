import { NextResponse } from "next/server"
import { getProUser } from "@/lib/session"
import { getDepotRowsByVendorId } from "@/lib/vendor-depot-compat"

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

    const points = await getDepotRowsByVendorId(user.id)
    // Return all depots for the vendor
    return NextResponse.json({ points })
  } catch (err) {
    console.error("[depot/mine] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dépôts" },
      { status: 500 }
    )
  }
}