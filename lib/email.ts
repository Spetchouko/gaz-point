import nodemailer from "nodemailer"

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

interface MailInfo {
  accepted?: unknown[]
  rejected?: unknown[]
  response?: string
}

interface Transporter {
  sendMail(options: unknown): Promise<MailInfo>
}

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      "Email non configuré : GMAIL_USER et GMAIL_APP_PASSWORD doivent être définis dans .env."
    )
  }
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  })
  return cachedTransporter
}

/**
 * Vérifie que le serveur SMTP a réellement accepté le message.
 * Une promesse résolue sans destinataire accepté doit lever une erreur.
 */
function assertMailAccepted(
  info: { accepted?: unknown[]; rejected?: unknown[]; response?: string },
  email: string
) {
  const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : 0
  const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0
  if (acceptedCount === 0 || rejectedCount > 0) {
    throw new Error(
      `Le serveur SMTP n'a pas accepté le message destiné à ${email} (réponse: ${info.response ?? "inconnue"})`
    )
  }
}

/**
 * Construit l'URL de verification par lien direct.
 * Utilise NEXT_PUBLIC_SITE_URL en production, sinon l'origine de la requete.
 */
export function buildVerificationLink(
  token: string,
  siteUrl?: string | null
): string {
  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return `${base.replace(/\/$/, "")}/api/auth/email-otp/verify-link?token=${encodeURIComponent(token)}`
}

export interface VerificationEmailParams {
  email: string
  code: string
  expiresInMinutes: number
  verificationLink?: string
}

export interface VendorApprovalResultEmailParams {
  vendorName: string | null
  vendorEmail: string
  approved: boolean
  rejectionReason?: string
  adminDashboardUrl: string
}

/**
 * Template HTML moderne et responsive pour l'email de verification.
 * Compatible Gmail (web/mobile) et principaux clients email.
 * CSS inline uniquement, pas de JS, pas d'image externe indispensable.
 */
function buildVerificationHtml({
  code,
  expiresInMinutes,
  verificationLink,
}: {
  code: string
  expiresInMinutes: number
  verificationLink?: string
}): string {
  const codeSpaced = code.split("").join(" ") // espaces fins pour lisibilite
  const linkSection = verificationLink
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${verificationLink}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:8px;font-size:16px;letter-spacing:0.3px;">
            Verifier mon adresse email
          </a>
        </td>
      </tr>
    </table>
    `
    : ""

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifiez votre adresse email - GazPoints</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <!-- En-tete -->
          <tr>
            <td align="center" style="background:#16a34a;padding:32px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">GazPoints</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Corps -->
          <tr>
            <td style="padding:32px 24px;color:#1f2937;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;text-align:center;">Verifiez votre adresse email</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;text-align:center;">
                Bienvenue sur GazPoints ! Nous sommes heureux de vous accueillir.
                Pour securiser votre compte, veuillez confirmer votre adresse email.
              </p>
              <!-- Code OTP -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:10px;">
                      <tr>
                        <td align="center" style="padding:24px;">
                          <span style="display:inline-block;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;color:#111827;letter-spacing:12px;">
                            ${codeSpaced}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:13px;color:#6b7280;text-align:center;">
                Ce code expire dans <strong>${expiresInMinutes} minutes</strong>. Ne le partagez avec personne.
              </p>
              ${linkSection}
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;line-height:1.6;">
                Ce code et ce lien sont personnels. Ne les partagez avec personne.<br>
                Si vous n'avez pas cree de compte sur GazPoints, ignorez cet email.
              </p>
            </td>
          </tr>
          <!-- Pied de page -->
          <tr>
            <td style="background:#f9fafb;padding:24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;text-align:center;">L'equipe GazPoints</p>
              <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-align:center;">Trouvez votre bouteille de gaz avant de vous deplacer.</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Contact : gazpoints@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Version texte simple en complement du HTML.
 */
function buildVerificationText({
  code,
  expiresInMinutes,
  verificationLink,
}: {
  code: string
  expiresInMinutes: number
  verificationLink?: string
}): string {
  return `
GazPoints — Verification de votre adresse email

Bienvenue sur GazPoints ! Nous sommes heureux de vous accueillir.
Pour securiser votre compte, veuillez confirmer votre adresse email.

Votre code de verification a 6 chiffres : ${code}
Ce code expire dans ${expiresInMinutes} minutes.

${verificationLink ? `Ou verifiez directement en cliquant ici : ${verificationLink}\n` : ""}

Ce code et ce lien sont personnels. Ne les partagez avec personne.
Si vous n'avez pas cree de compte sur GazPoints, ignorez cet email.

---
L'equipe GazPoints
Trouvez votre bouteille de gaz avant de vous deplacer.
Contact : gazpoints@gmail.com
  `
}

export async function sendVerificationEmail({
  email,
  code,
  expiresInMinutes,
  verificationLink,
}: VerificationEmailParams) {
  const transporter = getTransporter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const link = verificationLink ?? buildVerificationLink(code, siteUrl)

  const html = buildVerificationHtml({ code, expiresInMinutes, verificationLink: link })
  const text = buildVerificationText({ code, expiresInMinutes, verificationLink: link })

  const info = await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: email,
    subject: `Verifiez votre adresse email – GazPoints`,
    text,
    html,
  })
  assertMailAccepted(info, email)
  return info
}

export async function sendVerificationEmailResend({
  email,
  code,
  expiresInMinutes,
  verificationLink,
}: VerificationEmailParams) {
  const transporter = getTransporter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const link = verificationLink ?? buildVerificationLink(code, siteUrl)

  const html = buildVerificationHtml({ code, expiresInMinutes, verificationLink: link })
  const text = buildVerificationText({ code, expiresInMinutes, verificationLink: link })

  const info = await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: email,
    subject: `Nouveau code de verification GazPoints : ${code}`,
    text,
    html,
  })
  assertMailAccepted(info, email)
  return info
}

export async function sendVendorApprovalResultEmail({
  vendorName,
  vendorEmail,
  approved,
  rejectionReason,
  adminDashboardUrl,
}: VendorApprovalResultEmailParams) {
  const transporter = getTransporter()

  const recipient = vendorName?.trim() || "vendeur"
  const title = approved ? "GazPoints — Compte vendeur approuve" : "GazPoints — Compte vendeur refuse"
  const intro = approved
    ? "Bonne nouvelle ! Votre compte vendeur a ete approuve. Vous pouvez desormais gerer vos points de vente et vos disponibilites depuis votre espace vendeur."
    : "Apres examen de votre demande, votre compte vendeur n'a pas ete approuve pour le moment."
  const reasonBlock = !approved && rejectionReason
    ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:24px 0;">
              <p style="color:#1a1a2e;margin:0 0 8px;font-size:14px;font-weight:600;">Motif :</p>
              <p style="color:#4a4a6a;margin:0;font-size:14px;">${rejectionReason}</p>
            </td>
          </tr>
        </table>
      `
    : ""
  const actionLabel = approved ? "Acceder a mon espace vendeur" : "Acceder a mon espace"

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#16a34a;padding:32px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">GazPoints</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;color:#1f2937;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;text-align:center;">${title}</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4b5563;text-align:center;">Bonjour ${recipient},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;text-align:center;">${intro}</p>
              ${reasonBlock}
              <div style="text-align:center;margin:24px 0;">
                <a href="${adminDashboardUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">${actionLabel}</a>
              </div>
              <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;line-height:1.6;">
                Si vous avez des questions, contactez notre equipe depuis GazPoints.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">L'equipe GazPoints</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
${title}

Bonjour ${recipient},

${intro}
${!approved && rejectionReason ? `\nMotif : ${rejectionReason}\n` : ""}
${actionLabel} : ${adminDashboardUrl}

---
L'equipe GazPoints
  `

  await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: vendorEmail,
    subject: title,
    text,
    html,
  })
}

export interface NewConsignationEmailParams {
  vendorEmail: string
  reservationCode: string
  pointName: string
  brand: string | null
  format: string | null
  reservedAt: Date
}

interface ConsignationEmailContent {
  reservationCode: string
  pointName: string
  brand: string | null
  format: string | null
  reservedAt: Date
}

function buildNewConsignationHtml({
  reservationCode,
  pointName,
  brand,
  format,
  reservedAt,
}: ConsignationEmailContent): string {
  const dateStr = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(reservedAt)
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle consignation reçue – GazPoints</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#16a34a;padding:32px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">GazPoints</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;color:#1f2937;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;text-align:center;">Nouvelle consignation reçue</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;text-align:center;">
                Une nouvelle consignation vient d&apos;être effectuée sur votre point de vente GazPoints.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;">Code de consignation</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#16a34a;letter-spacing:2px;font-family:monospace;">${reservationCode}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;">Point de vente</p>
                    <p style="margin:0;font-size:14px;color:#4b5563;">${pointName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;">Bouteille</p>
                    <p style="margin:0;font-size:14px;color:#4b5563;">${format ?? "—"}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;">Marque</p>
                    <p style="margin:0;font-size:14px;color:#4b5563;">${brand ?? "—"}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;">Date et heure</p>
                    <p style="margin:0;font-size:14px;color:#4b5563;">${dateStr}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;text-align:center;">
                Connectez-vous à votre espace vendeur pour consulter les détails de cette consignation.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gazpoints.com"}/dashboard/vendeur/consignations" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">Voir mes consignations</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;text-align:center;">L&apos;équipe GazPoints</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Trouvez votre bouteille de gaz avant de vous déplacer.</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Contact : gazpoints@gmail.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function buildNewConsignationText({
  reservationCode,
  pointName,
  brand,
  format,
  reservedAt,
}: ConsignationEmailContent): string {
  const dateStr = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(reservedAt)
  return `
GazPoints — Nouvelle consignation reçue

Bonjour,

Une nouvelle consignation vient d'être effectuée sur votre point de vente GazPoints.

Informations de la consignation :
- Code de consignation : ${reservationCode}
- Point de vente : ${pointName}
- Bouteille : ${format ?? "—"}
- Marque : ${brand ?? "—"}
- Date : ${dateStr}

Connectez-vous à votre espace vendeur pour consulter les détails de cette consignation.

---
L'équipe GazPoints
Trouvez votre bouteille de gaz avant de vous déplacer.
Contact : gazpoints@gmail.com
  `
}

export async function sendNewConsignationEmail({
  vendorEmail,
  reservationCode,
  pointName,
  brand,
  format,
  reservedAt,
}: NewConsignationEmailParams) {
  const transporter = getTransporter()
  const html = buildNewConsignationHtml({
    reservationCode,
    pointName,
    brand,
    format,
    reservedAt,
  })
  const text = buildNewConsignationText({
    reservationCode,
    pointName,
    brand,
    format,
    reservedAt,
  })

  const info = await transporter.sendMail({
    from: `"GazPoints" <${GMAIL_USER}>`,
    to: vendorEmail,
    subject: "Nouvelle consignation reçue sur votre point de vente — GazPoints",
    text,
    html,
  })
  assertMailAccepted(info, vendorEmail)
  return info
}
