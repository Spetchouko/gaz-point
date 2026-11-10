import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user, vendorOnboarding } from "@/db/schema"
import { vendorSignupRateLimiter } from "@/lib/rate-limit"
import { validateVendorSignupPayload } from "@/lib/vendor-onboarding"

/**
 * Inscription vendeur en une seule requête serveur :
 * 1. crée le compte Better Auth (rôle vendeur) ;
 * 2. enregistre immédiatement le brouillon commercial (dépôt, localisation,
 *    marques) dans vendor_onboarding.
 *
 * L'OTP reste entièrement géré par les routes existantes. Le brouillon n'est
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
      // Une relance après un échec réseau doit pouvoir reprendre le parcours
      // sans créer de doublon. Un compte déjà vérifié ou non vendeur est refusé.
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
      userId = existing.id
      await db.update(user).set({ name: data.name }).where(eq(user.id, userId))
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

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[vendor-signup] unexpected error:", message)
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue." } },
      { status: 500 }
    )
  }
}
