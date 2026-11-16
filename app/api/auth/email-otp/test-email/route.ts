import { NextRequest, NextResponse } from "next/server"
import { sendVerificationEmail } from "@/lib/email"
import { resolveSmtpCredentials, getTransporter } from "@/lib/email"

/**
 * Endpoint de diagnostic pour tester la configuration email.
 * Accessible uniquement en développement ou avec un secret.
 * GET /api/auth/email-otp/test-email?email=test@example.com
 */
export async function GET(req: NextRequest) {
  // Protection : seulement en dev ou avec CRON_SECRET
  const isDev = process.env.NODE_ENV !== "production"
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isDev && !hasValidSecret) {
    return NextResponse.json(
      { error: "Non autorisé. Utilisez l'en-tête Authorization: Bearer <CRON_SECRET> en production." },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const testEmail = searchParams.get("email")

  if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
    return NextResponse.json(
      { error: "Paramètre 'email' requis et doit être valide." },
      { status: 400 }
    )
  }

  const diag: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    testEmail,
  }

  // 1. Vérifier les variables d'environnement
  const creds = resolveSmtpCredentials()
  diag.envCheck = {
    hasGmailUser: !!process.env.GMAIL_USER,
    hasGmailAppPassword: !!process.env.GMAIL_APP_PASSWORD,
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    resolvedUser: creds?.user ? `${creds.user.slice(0, 3)}***@${creds.user.split("@")[1]}` : "NON RÉSOLU",
    resolvedPassLength: creds?.pass?.length ?? 0,
  }

  if (!creds) {
    diag.status = "FAIL"
    diag.error = "Aucunes identifiants SMTP trouvés (GMAIL_USER/GMAIL_APP_PASSWORD ou EMAIL_USER/EMAIL_PASS)"
    return NextResponse.json(diag, { status: 500 })
  }

  // 2. Tester la création du transporteur
  let transporter
  try {
    transporter = getTransporter()
    diag.transporterCreated = true
  } catch (e) {
    diag.status = "FAIL"
    diag.error = `Échec création transporteur: ${e instanceof Error ? e.message : String(e)}`
    return NextResponse.json(diag, { status: 500 })
  }

  // 3. Tester la connexion SMTP (verify)
  try {
    await transporter.verify()
    diag.smtpVerify = "OK"
  } catch (e) {
    diag.status = "FAIL"
    diag.smtpVerify = "FAILED"
    diag.error = `Échec vérification SMTP: ${e instanceof Error ? e.message : String(e)}`
    return NextResponse.json(diag, { status: 500 })
  }

  // 4. Envoyer un email de test
  try {
    const testCode = "123456"
    const info = await sendVerificationEmail({
      email: testEmail,
      code: testCode,
      expiresInMinutes: 10,
      verificationLink: "https://example.com/test-link",
    })
    diag.status = "OK"
    diag.sendResult = {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    }
  } catch (e) {
    diag.status = "FAIL"
    diag.error = `Échec envoi email: ${e instanceof Error ? e.message : String(e)}`
    return NextResponse.json(diag, { status: 500 })
  }

  return NextResponse.json(diag)
}