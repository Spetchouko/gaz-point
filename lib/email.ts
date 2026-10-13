import nodemailer from "nodemailer"

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.warn("[email] GMAIL_USER or GMAIL_APP_PASSWORD not configured. Email sending will fail.")
}

function createTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Email not configured: GMAIL_USER and GMAIL_APP_PASSWORD must be set")
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  })
}

export interface VerificationEmailParams {
  email: string
  code: string
  expiresInMinutes: number
}

export interface VendorApprovalResultEmailParams {
  vendorName: string | null
  vendorEmail: string
  approved: boolean
  rejectionReason?: string
  adminDashboardUrl: string
}

export async function sendVerificationEmail({ email, code, expiresInMinutes }: VerificationEmailParams) {
  const transporter = createTransporter()

  const html = `
    <div style="font-family:sans-serif;font-size:14px;line-height:1.6;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f8f9fa;border-radius:8px;padding:24px">
        <h1 style="color:#1a1a2e;margin:0 0 16px;font-size:24px">GazPoints — Confirmation d'email</h1>
        <p style="color:#4a4a6a;margin:0 0 24px;font-size:16px">
          Bienvenue sur GazPoints ! Pour valider votre compte, utilisez le code ci-dessous :
        </p>
        <div style="background:#fff;border:2px solid #e0e0e0;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-family:monospace;font-size:32px;font-weight:bold;color:#1a1a2e;letter-spacing:8px">${code}</span>
        </div>
        <p style="color:#6a6a8a;margin:0 0 16px;font-size:14px">
          Ce code expire dans <strong>${expiresInMinutes} minutes</strong>. Ne le partagez avec personne.
        </p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
        <p style="color:#8a8a9a;margin:0;font-size:12px">
          Si vous n'avez pas créé de compte sur GazPoints, ignorez cet email.
        </p>
      </div>
    </div>
  `

  const text = `
GazPoints — Confirmation d'email

Bienvenue sur GazPoints ! Pour valider votre compte, utilisez le code ci-dessous :

Code : ${code}

Ce code expire dans ${expiresInMinutes} minutes. Ne le partagez avec personne.

---
Si vous n'avez pas créé de compte sur GazPoints, ignorez cet email.
  `

  await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: email,
    subject: `Votre code de validation GazPoints : ${code}`,
    text,
    html,
  })
}

export async function sendVerificationEmailResend({ email, code, expiresInMinutes }: VerificationEmailParams) {
  const transporter = createTransporter()

  const html = `
    <div style="font-family:sans-serif;font-size:14px;line-height:1.6;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f8f9fa;border-radius:8px;padding:24px">
        <h1 style="color:#1a1a2e;margin:0 0 16px;font-size:24px">GazPoints — Nouveau code de validation</h1>
        <p style="color:#4a4a6a;margin:0 0 24px;font-size:16px">
          Voici votre nouveau code de validation (l'ancien a été invalidé) :
        </p>
        <div style="background:#fff;border:2px solid #e0e0e0;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-family:monospace;font-size:32px;font-weight:bold;color:#1a1a2e;letter-spacing:8px">${code}</span>
        </div>
        <p style="color:#6a6a8a;margin:0 0 16px;font-size:14px">
          Ce code expire dans <strong>${expiresInMinutes} minutes</strong>. Ne le partagez avec personne.
        </p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
        <p style="color:#8a8a9a;margin:0;font-size:12px">
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
      </div>
    </div>
  `

  const text = `
GazPoints — Nouveau code de validation

Voici votre nouveau code de validation (l'ancien a été invalidé) :

Code : ${code}

Ce code expire dans ${expiresInMinutes} minutes. Ne le partagez avec personne.

---
Si vous n'avez pas demandé ce code, ignorez cet email.
  `

  await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: email,
    subject: `Nouveau code de validation GazPoints : ${code}`,
    text,
    html,
  })
}

export async function sendVendorApprovalResultEmail({
  vendorName,
  vendorEmail,
  approved,
  rejectionReason,
  adminDashboardUrl,
}: VendorApprovalResultEmailParams) {
  const transporter = createTransporter()

  const recipient = vendorName?.trim() || "vendeur"
  const title = approved ? "GazPoints — Compte vendeur approuvé" : "GazPoints — Compte vendeur refusé"
  const intro = approved
    ? "Bonne nouvelle ! Votre compte vendeur a été approuvé. Vous pouvez dès à présent gérer vos points de vente et vos disponibilités depuis votre espace vendeur."
    : "Après examen de votre demande, votre compte vendeur n'a pas été approuvé pour le moment."
  const reasonBlock = !approved && rejectionReason
    ? `
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:24px 0">
          <p style="color:#1a1a2e;margin:0 0 8px;font-size:14px;font-weight:bold">Motif :</p>
          <p style="color:#4a4a6a;margin:0;font-size:14px">${rejectionReason}</p>
        </div>
      `
    : ""
  const actionLabel = approved ? "Accéder à mon espace vendeur" : "Accéder à mon espace"

  const html = `
    <div style="font-family:sans-serif;font-size:14px;line-height:1.6;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f8f9fa;border-radius:8px;padding:24px">
        <h1 style="color:#1a1a2e;margin:0 0 16px;font-size:24px">${title}</h1>
        <p style="color:#4a4a6a;margin:0 0 16px;font-size:16px">Bonjour ${recipient},</p>
        <p style="color:#4a4a6a;margin:0 0 24px;font-size:16px">${intro}</p>
        ${reasonBlock}
        <div style="text-align:center;margin:24px 0">
          <a href="${adminDashboardUrl}" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px">${actionLabel}</a>
        </div>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
        <p style="color:#8a8a9a;margin:0;font-size:12px">
          Si vous avez des questions, contactez notre équipe depuis GazPoints.
        </p>
      </div>
    </div>
  `

  const text = `
${title}

Bonjour ${recipient},

${intro}
${!approved && rejectionReason ? `\nMotif : ${rejectionReason}\n` : ""}
${actionLabel} : ${adminDashboardUrl}

---
Si vous avez des questions, contactez notre équipe depuis GazPoints.
  `

  await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: vendorEmail,
    subject: title,
    text,
    html,
  })
}