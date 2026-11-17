import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user, vendorOnboarding } from "@/db/schema"
import { vendorSignupRateLimiter } from "@/lib/rate-limit"
import { validateVendorSignupPayload } from "@/lib/vendor-signup-validation"

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") return {}
  const value = error as {
    code?: unknown
    status?: unknown
    statusCode?: unknown
    message?: unknown
    body?: { code?: unknown }
  }
  return {
    code:
      typeof value.code === "string"
        ? value.code
        : typeof value.body?.code === "string"
          ? value.body.code
          : "",
    status:
      typeof value.status === "number"
        ? value.status
        : typeof value.statusCode === "number"
          ? value.statusCode
          : 0,
    message: typeof value.message === "string" ? value.message : "",
  }
}

/**
 * Vérifie le mot de passe d'un compte déjà commencé sans créer de session.
 *
 * Better Auth vérifie le mot de passe avant de refuser la connexion d'un
 * compte dont l'email n'est pas encore vérifié. L'erreur EMAIL_NOT_VERIFIED
 * confirme donc que les identifiants sont corrects.
 */
async function pendingAccountPasswordMatches(
  email: string,
  password: string
): Promise<boolean> {
  try {
    await auth.api.signInEmail({ body: { email, password } })
    return true
  } catch (error) {
    const { code, status, message } = errorDetails(error)
    return (
      code === "EMAIL_NOT_VERIFIED" ||
      (status === 403 && /vérifi|verifi/i.test(message))
    )
  }
}

/**
 * Inscription vendeur en une seule requête serveur :
 * 1. crée le compte Better Auth (rôle vendeur) ;
 * 2. enregistre immédiatement le brouillon commercial (dépôt, localisation,
 *    marques) dans vendor_onboarding.
 *
 * L'OTP reste entièrement géré par la route OTP existante. Le brouillon n'est
 * jamais public : le point de vente n'est créé qu'après vérification, depuis
 * une session vendeur authentifiée.
 */
export async function POST(req: NextRequest) {
  const limit = vendorSignupRateLimiter.checkRateLimit(req)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { message: "Trop de tentatives. Réessayez dans quelques instants." } },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const validation = validateVendorSignupPayload(body)
  if (!validation.ok) {
    return NextResponse.json(
      { error: { message: validation.message, field: validation.field } },
      { status: 400 }
    )
  }

  const data = validation.data
  let createdUserId: string | null = null

  try {
    const [existing] = await db
      .select({
        id: user.id,
        role: user.role,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1)

    let userId: string

    if (existing) {
      if (existing.emailVerified || existing.role !== "vendor") {
        return NextResponse.json(
          {
            error: {
              field: "email",
              message:
                "Cette adresse email est déjà utilisée. Essayez de vous connecter.",
            },
          },
          { status: 409 }
        )
      }

      const passwordMatches = await pendingAccountPasswordMatches(
        data.email,
        data.password
      )
      if (!passwordMatches) {
        return NextResponse.json(
          {
            error: {
              field: "password",
              message:
                "Une inscription est déjà commencée avec cette adresse. Utilisez le mot de passe original ou réinitialisez votre mot de passe.",
            },
          },
          { status: 409 }
        )
      }

      userId = existing.id
    } else {
      try {
        const result = await auth.api.signUpEmail({
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: "vendor",
          },
        })
        userId = result.user.id
        createdUserId = userId
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossible de créer le compte."
        const lower = message.toLowerCase()
        if (
          lower.includes("email") ||
          lower.includes("already") ||
          lower.includes("exist") ||
          lower.includes("déjà")
        ) {
          return NextResponse.json(
            {
              error: {
                field: "email",
                message:
                  "Cette adresse email est déjà utilisée. Essayez de vous connecter.",
              },
            },
            { status: 409 }
          )
        }
        console.error("[vendor-signup] signUpEmail failed:", message)
        return NextResponse.json(
          { error: { message: "Impossible de créer le compte vendeur." } },
          { status: 500 }
        )
      }
    }

    const now = new Date()
    await db
      .update(user)
      .set({
        name: data.name,
        approvalStatus: "pending",
        approvalRequestedAt: now,
      })
      .where(eq(user.id, userId))

    try {
      await db
        .insert(vendorOnboarding)
        .values({
          id: randomUUID(),
          userId,
          pointName: data.name,
          district: data.district,
          address: data.address,
          brands: data.brands,
          inventory: [],
          status: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: vendorOnboarding.userId,
          set: {
            pointName: data.name,
            district: data.district,
            address: data.address,
            brands: data.brands,
            updatedAt: now,
          },
        })
    } catch (error) {
      // Ne laisse pas de compte vendeur orphelin si le brouillon ne peut pas
      // être enregistré. La suppression est limitée au compte créé ici.
      if (createdUserId) {
        await db.delete(user).where(eq(user.id, createdUserId)).catch(() => undefined)
      }
      throw error
    }

    return NextResponse.json({ ok: true, resumed: Boolean(existing) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[vendor-signup] unexpected error:", message)
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue." } },
      { status: 500 }
    )
  }
}
