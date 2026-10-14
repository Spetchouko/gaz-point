import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, gt } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user, verification } from "@/db/schema"
import { sendVerificationEmail, sendVerificationEmailResend } from "@/lib/email"

// Doit rester cohérent avec le décompte affiché dans l'interface (60 s).
const RESEND_COOLDOWN_SECONDS = 60
// Doit rester cohérent avec `expiresIn` du plugin emailOTP (600 s).
const VERIFICATION_EXPIRY_SECONDS = 600
const VERIFICATION_EXPIRY_MINUTES = Math.ceil(VERIFICATION_EXPIRY_SECONDS / 60)

// Identifiant utilisé par le plugin emailOTP pour le code de vérification d'email
// (cf. better-auth `toOTPIdentifier(type, email)`).
function otpIdentifier(email: string) {
  return `email-verification-otp-${email}`
}

/**
 * Envoie (ou renvoie) le code de vérification à 6 chiffres.
 *
 * Corps : { email: string, resend?: boolean }
 *  - `resend` absent ou `true` → email « nouveau code » (défaut, utilisé par l'UI) ;
 *  - `resend: false` → email d'accueil initial (utilisé juste après l'inscription).
 *
 * Le code est généré et stocké de façon sécurisée par le plugin emailOTP
 * (6 chiffres, haché, expiration 10 min, 3 essais). Le succès n'est renvoyé
 * que si le fournisseur d'email a accepté le message.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string; resend?: boolean }
      | null
    const email = body?.email?.toLowerCase().trim()
    const isResend = body?.resend !== false

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: { message: "Email invalide." } }, { status: 400 })
    }

    // 1) Vérifie l'existence et l'état du compte côté serveur.
    const [account] = await db
      .select({ id: user.id, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    // Anti-énumération : on répond « ok » sans rien envoyer si le compte est
    // inconnu ou déjà vérifié (aucune fuite d'information sur les comptes).
    if (!account || account.emailVerified) {
      return NextResponse.json({ ok: true })
    }

    // 2) Limitation serveur : un seul envoi toutes les 60 s, aligné sur l'UI.
    const now = new Date()
    const identifier = otpIdentifier(email)
    const [recent] = await db
      .select({ createdAt: verification.createdAt })
      .from(verification)
      .where(
        and(
          eq(verification.identifier, identifier),
          gt(
            verification.createdAt,
            new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000)
          )
        )
      )
      .orderBy(desc(verification.createdAt))
      .limit(1)

    if (recent) {
      const elapsed = Math.floor(
        (now.getTime() - new Date(recent.createdAt).getTime()) / 1000
      )
      const remaining = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsed)
      return NextResponse.json(
        {
          error: {
            message: `Veuillez patienter ${remaining}s avant de demander un nouveau code.`,
            retryAfter: remaining,
          },
        },
        { status: 429 }
      )
    }

    // 3) Invalide les éventuels anciens codes (un seul code valide à la fois).
    await db.delete(verification).where(eq(verification.identifier, identifier))

    // 4) Génère + stocke un nouveau code à 6 chiffres (stockage haché).
    const code = await auth.api.createVerificationOTP({
      body: { email, type: "email-verification" },
    })

    // 5) Envoi effectif. On ne confirme le succès que si l'envoi a réussi.
    try {
      if (isResend) {
        await sendVerificationEmailResend({
          email,
          code,
          expiresInMinutes: VERIFICATION_EXPIRY_MINUTES,
        })
      } else {
        await sendVerificationEmail({
          email,
          code,
          expiresInMinutes: VERIFICATION_EXPIRY_MINUTES,
        })
      }
    } catch (emailError) {
      console.error("[send-verification] email send failed:", emailError)
      // Nettoie le code non délivré : l'utilisateur peut réessayer immédiatement.
      await db
        .delete(verification)
        .where(eq(verification.identifier, identifier))
        .catch(() => {})
      return NextResponse.json(
        {
          error: {
            message: "L'envoi de l'email a échoué. Veuillez réessayer dans un instant.",
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-verification] error:", err)
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue." } },
      { status: 500 }
    )
  }
}
