import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { user, verification } from "@/db/schema"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(
        `${new URL(req.url).origin}/validation-email?error=missing_token`
      )
    }

    // 1) Recupere l'enregistrement de verification associe au jeton.
    // Identifiant : email-verification-link-<token>
    // Valeur      : email du compte a verifier
    const [record] = await db
      .select({ value: verification.value, expiresAt: verification.expiresAt })
      .from(verification)
      .where(eq(verification.identifier, `email-verification-link-${token}`))
      .limit(1)

    if (!record) {
      return NextResponse.redirect(
        `${new URL(req.url).origin}/validation-email?error=invalid_link`
      )
    }

    // 2) Verifie l'expiration.
    const now = new Date()
    if (new Date(record.expiresAt) < now) {
      // Supprime le jeton expire pour nettoyer.
      await db.delete(verification).where(eq(verification.identifier, `email-verification-link-${token}`))
      return NextResponse.redirect(
        `${new URL(req.url).origin}/validation-email?error=expired_link`
      )
    }

    const email = record.value

    // 3) Marque l'email comme verifie et invalide le jeton (usage unique).
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, email))

    await db.delete(verification).where(eq(verification.identifier, `email-verification-link-${token}`))

    await db
      .update(user)
      .set({ approvalStatus: "approved", approvalProcessedAt: new Date() })
      .where(and(eq(user.email, email), eq(user.role, "vendor")))

    // 4) Le lien ne crée pas de session. La connexion reprend avec le rôle
    // relu dans la base par la route serveur de redirection.
    return NextResponse.redirect(
      `${new URL(req.url).origin}/connexion?email=${encodeURIComponent(email)}&verified=1`
    )
  } catch (err) {
    console.error("[verify-link] error:", err)
    return NextResponse.redirect(
      `${new URL(req.url).origin}/validation-email?error=server_error`
    )
  }
}
