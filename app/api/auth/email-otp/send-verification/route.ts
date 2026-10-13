import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { verification } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { sendVerificationEmailResend } from "@/lib/email"

const RESEND_COOLDOWN_SECONDS = 60
const VERIFICATION_CODE_LENGTH = 6
const VERIFICATION_EXPIRY_SECONDS = 600

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function rateLimitKey(email: string) {
  return `resend_verification:${email.toLowerCase()}`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null
    const email = body?.email?.toLowerCase().trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: { message: "Email invalide." } }, { status: 400 })
    }

    // Vérifier le cooldown via la base de données (dernière vérification envoyée)
    const now = new Date()
    const recentVerification = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          gt(verification.createdAt, new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000))
        )
      )
      .limit(1)

    if (recentVerification.length > 0) {
      const lastSent = recentVerification[0].createdAt
      const elapsed = Math.floor((now.getTime() - new Date(lastSent).getTime()) / 1000)
      const remaining = RESEND_COOLDOWN_SECONDS - elapsed
      return NextResponse.json(
        { error: { message: `Veuillez patienter ${remaining}s avant de demander un nouveau code.` } },
        { status: 429 }
      )
    }

    // Générer un nouveau code
    const code = generateCode()
    const expiresAt = new Date(now.getTime() + VERIFICATION_EXPIRY_SECONDS * 1000)

    // Invalider les anciens codes pour cet email (supprimer)
    await db.delete(verification).where(eq(verification.identifier, email))

    // Insérer le nouveau code
    await db.insert(verification).values({
      id: randomUUID(),
      identifier: email,
      value: code,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })

    // Envoyer l'email
    try {
      await sendVerificationEmailResend({
        email,
        code,
        expiresInMinutes: Math.ceil(VERIFICATION_EXPIRY_SECONDS / 60),
      })
    } catch (emailError) {
      console.error("[send-verification] email send failed:", emailError)
      // Ne pas révéler l'erreur email à l'utilisateur, mais logger côté serveur
      return NextResponse.json(
        { error: { message: "L'envoi de l'email a échoué. Veuillez réessayer dans un instant." } },
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