import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, gt } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user, verification } from "@/db/schema"
import { sendVerificationEmail, sendVerificationEmailResend, buildVerificationLink } from "@/lib/email"
import { verificationSendRateLimiter } from "@/lib/rate-limit"

// Doit rester coherent avec le décompte affiché dans l'interface (60 s).
const RESEND_COOLDOWN_SECONDS = 60
// Doit rester coherent avec `expiresIn` du plugin emailOTP (600 s).
const VERIFICATION_EXPIRY_SECONDS = 600
const VERIFICATION_EXPIRY_MINUTES = Math.ceil(VERIFICATION_EXPIRY_SECONDS / 60)
const LINK_MAX_AGE_SECONDS = 600 // 10 minutes, identique au code OTP

// Identifiant utilisé par le plugin emailOTP pour le code de vérification d'email
// (cf. better-auth `toOTPIdentifier(type, email)`).
function otpIdentifier(email: string) {
  return `email-verification-otp-${email}`
}

// Identifiant utilisé pour le jeton de verification par lien direct.
function linkTokenIdentifier(token: string) {
  return `email-verification-link-${token}`
}

/**
 * Genere un jeton de verification securise a usage unique.
 */
function generateLinkToken(): string {
  return crypto.randomUUID()
}

/**
 * Envoie (ou renvoie) le code de verification a 6 chiffres.
 *
 * Corps : { email: string, resend?: boolean }
 *  - `resend` absent ou `true` -> email « nouveau code » (defaut, utilise par l'UI) ;
 *  - `resend: false` -> email d'accueil initial (utilise juste apres l'inscription).
 *
 * Le code est genere et stocke de maniere securisee par le plugin emailOTP
 * (6 chiffres, hache, expiration 10 min, 3 essais). Le succes n'est renvoye
 * que si le fournisseur d'email a accepte le message.
 *
 * Un jeton de verification par lien direct est egalement genere et stocke
 * afin d'etre inclus dans le meme email (methode B).
 */
export async function POST(req: NextRequest) {
  const check = verificationSendRateLimiter.checkRateLimit(req)
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    )
  }

  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string; resend?: boolean }
      | null
    const email = body?.email?.toLowerCase().trim()
    const isResend = body?.resend !== false

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: { message: "Email invalide." } }, { status: 400 })
    }

    // 1) Verifie l'existence et l'etat du compte cote serveur.
    const [account] = await db
      .select({ id: user.id, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    // Anti-enumeration : on repond « ok » sans rien envoyer si le compte est
    // inconnu ou deja verifie (aucune fuite d'information sur les comptes).
    if (!account || account.emailVerified) {
      return NextResponse.json({ ok: true })
    }

    // 2) Limitation serveur : un seul envoi toutes les 60 s, aligne sur l'UI.
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

    // 3) Invalide les eventuels anciens codes et anciens jetons de lien.
    await db.delete(verification).where(eq(verification.identifier, identifier))

    // 4) Genere + stocke un nouveau code a 6 chiffres (stockage hache).
    const code = await auth.api.createVerificationOTP({
      body: { email, type: "email-verification" },
    })

    // 5) Genere et stocke un jeton de verification par lien direct (methode B).
    const linkToken = generateLinkToken()
    const expiresAt = new Date(now.getTime() + LINK_MAX_AGE_SECONDS * 1000)
    await db.insert(verification).values({
      id: linkToken, // reuse le token comme id pour simplicite
      identifier: linkTokenIdentifier(linkToken),
      value: email,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })

    // 6) Construit le lien de verification directe.
    const verificationLink = buildVerificationLink(
      linkToken,
      process.env.NEXT_PUBLIC_SITE_URL
    )

    // 7) Envoi effectif. On confirme le succès QUE si l'envoi a reussi.
    try {
      if (isResend) {
        await sendVerificationEmailResend({
          email,
          code,
          expiresInMinutes: VERIFICATION_EXPIRY_MINUTES,
          verificationLink,
        })
      } else {
        await sendVerificationEmail({
          email,
          code,
          expiresInMinutes: VERIFICATION_EXPIRY_MINUTES,
          verificationLink,
        })
      }
    } catch (emailError) {
      console.error("[send-verification] email send failed:", emailError)
      // Nettoie le code et le jeton non delivres : l'utilisateur peut reessayer immediatement.
      await db
        .delete(verification)
        .where(eq(verification.identifier, identifier))
        .catch(() => {})
      await db
        .delete(verification)
        .where(eq(verification.identifier, linkTokenIdentifier(linkToken)))
        .catch(() => {})
      return NextResponse.json(
        {
          error: {
            message: "L'envoi de l'email a echoue. Veuillez reessayer dans un instant.",
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
