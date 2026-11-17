import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorOnboarding } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProUser } from "@/lib/session"

/**
 * GET /api/vendor/onboarding
 *
 * Récupère le brouillon d'inscription vendeur (vendor_onboarding) associé
 * au compte connecté. Utilisé pour préremplir le formulaire de création
 * du point de dépôt après vérification email et connexion.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const [onboarding] = await db
      .select()
      .from(vendorOnboarding)
      .where(eq(vendorOnboarding.userId, user.id))
      .limit(1)

    if (!onboarding) {
      return NextResponse.json({ onboarding: null })
    }

    return NextResponse.json({ onboarding })
  } catch (err) {
    console.error("[vendor/onboarding] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du brouillon vendeur" },
      { status: 500 }
    )
  }
}
