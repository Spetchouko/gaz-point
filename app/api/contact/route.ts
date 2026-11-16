import { NextResponse } from "next/server"
import { contactRateLimiter } from "@/lib/rate-limit"
import { getTransporter, resolveSmtpCredentials } from "@/lib/email"

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "gazpoints@gmail.com"

const OBJETS = [
  "Question générale",
  "Signalement",
  "Problème technique",
  "Données personnelles",
  "Facturation",
  "Partenariat ou presse",
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "\u0026")
    .replace(/</g, "\u003C")
    .replace(/>/g, "\u003E")
    .replace(/"/g, "\u0022")
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim()
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 })
}

export async function POST(request: Request) {
  // Rate limit: max 5 messages per hour per IP address
  const check = contactRateLimiter.checkRateLimit(request)
  if (!check.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return badRequest("Requête invalide.")
  }

  const nom = String(payload.nom ?? "").trim()
  const email = String(payload.email ?? "").trim()
  const objet = String(payload.objet ?? "").trim()
  const message = String(payload.message ?? "").trim()

  if (!nom || !email || !message) {
    return badRequest("Renseigne ton nom, ton email et ton message.")
  }
  if (!emailPattern.test(email)) {
    return badRequest("L'adresse email n'est pas valide.")
  }
  if (message.length > 5000) {
    return badRequest("Le message est trop long (5 000 caractères maximum).")
  }

  // Sanitize replyTo: strip any user-provided replyTo emails to prevent self-DoS
  // (replyTo must be an internal email, not the sender's own).
  const sanitizedReplyTo = sanitizeReplyTo(payload.replyTo, email)

  const objetFinal = OBJETS.includes(objet) ? objet : "Question générale"

  // Vérifier que la config email existe
  const creds = resolveSmtpCredentials()
  if (!creds) {
    return NextResponse.json(
      { ok: false, error: "Le formulaire n'est pas encore configuré." },
      { status: 503 }
    )
  }

  try {
    const transporter = getTransporter()

    await transporter.sendMail({
      from: `"GazPoints — Contact" <${creds.user}>`,
      to: CONTACT_EMAIL,
      replyTo: sanitizedReplyTo,
      subject: `[GazPoints] ${objetFinal} — ${singleLine(nom)}`,
      text: message,
      html: `
        <div style="font-family:sans-serif;font-size:14px;line-height:1.6">
          <p><strong>Objet :</strong> ${escapeHtml(objetFinal)}</p>
          <p><strong>Nom :</strong> ${escapeHtml(singleLine(nom))}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0" />
          <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: "L'envoi a échoué. Réessaie ou écris-nous par email." },
      { status: 500 }
    )
  }
}

/**
 * Sanitizes the replyTo field to prevent self-DoS attacks.
 * Strips any user-provided email that matches the sender's own address.
 * Returns a formatted string like "Name <address>" or null.
 */
function sanitizeReplyTo(replyTo: unknown, senderEmail: string): string | undefined {
  if (!replyTo || typeof replyTo !== "object") return undefined
  const r = replyTo as Record<string, unknown>
  const name = typeof r.name === "string" ? singleLine(r.name) : ""
  const address = typeof r.address === "string" ? r.address.trim() : ""
  // Strip if replyTo email matches the sender's own email (self-DoS protection)
  if (address && address.toLowerCase() === senderEmail.toLowerCase()) {
    return undefined
  }
  if (!name && !address) return undefined
  return name ? `${name} <${address || senderEmail}>` : (address || senderEmail)
}