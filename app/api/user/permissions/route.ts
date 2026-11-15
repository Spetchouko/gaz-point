import { NextResponse } from "next/server"
import { getCurrentUser, getAdminPermissions } from "@/lib/session"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const role = user.role ?? "client"

    // Admin a toutes les permissions
    if (role === "admin") {
      const allModules = [
        "utilisateurs",
        "clients",
        "vendeurs",
        "disponibilites",
        "reservations",
        "publicite",
        "collaborateurs",
        "marketing",
        "avis",
        "statistiques",
      ]
      return NextResponse.json({
        role,
        permissions: allModules,
      })
    }

    // Collaborateur a ses permissions assignées
    if (role === "collaborateur") {
      const permissions = await getAdminPermissions(user.id)
      return NextResponse.json({
        role,
        permissions: Array.from(permissions),
      })
    }

    // Client et vendor n'ont pas de permissions admin
    return NextResponse.json({
      role,
      permissions: [],
    })
  } catch (err) {
    console.error("[api/user/permissions] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des permissions" },
      { status: 500 }
    )
  }
}