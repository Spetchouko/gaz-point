import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user } from "@/db/schema"

function getAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", status: 500, message: "" }
  }

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
          : 500,
    message: typeof value.message === "string" ? value.message : "",
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      email?: string
      otp?: string
    } | null

    const email = body?.email?.toLowerCase().trim()
    const otp = body?.otp?.trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: { message: "Email invalide." } }, { status: 400 })
    }

    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: { message: "Le code doit contenir 6 chiffres." } },
        { status: 400 }
      )
    }

    const authResult = await auth.api.verifyEmailOTP({
      body: { email, otp },
      headers: req.headers,
      returnHeaders: true,
    })

    if (!authResult.response || authResult.response.status === false) {
      return NextResponse.json(
        { error: { message: "Code invalide ou expiré." } },
        { status: 400 }
      )
    }

    // Le compte vendeur devient opérationnel dès que l'email est vérifié.
    // L'approbation administrative n'est pas un prérequis de publication.
    await db
      .update(user)
      .set({ approvalStatus: "approved", approvalProcessedAt: new Date() })
      .where(and(eq(user.email, email), eq(user.role, "vendor")))

    const response = NextResponse.json({ ok: true })
    const setCookie = authResult.headers.get("set-cookie")
    if (setCookie) {
      response.headers.append("set-cookie", setCookie)
    }

    return response
  } catch (error) {
    const { code, status, message } = getAuthError(error)

    if (code === "OTP_EXPIRED") {
      return NextResponse.json(
        { error: { message: "Ce code a expiré. Demandez un nouveau code." } },
        { status: 400 }
      )
    }

    if (code === "TOO_MANY_ATTEMPTS") {
      return NextResponse.json(
        {
          error: {
            message:
              "Vous avez atteint la limite d'essais. Demandez un nouveau code.",
          },
        },
        { status: 403 }
      )
    }

    if (code === "INVALID_OTP" || code === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: { message: "Code invalide ou expiré." } },
        { status: 400 }
      )
    }

    console.error("[verify-email] error:", message || error)
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue." } },
      { status: status >= 400 && status < 600 ? status : 500 }
    )
  }
}
