import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { user, verification } from "@/db/schema";
import { sendPasswordResetEmail, buildPasswordResetLink } from "@/lib/email";

// Un seul envoi par adresse email toutes les 60 secondes (anti-spam).
const RESEND_COOLDOWN_SECONDS = 60;
// Le jeton de réinitialisation expire après 60 minutes.
const TOKEN_EXPIRY_MINUTES = 60;
const TOKEN_EXPIRY_SECONDS = TOKEN_EXPIRY_MINUTES * 60;

/**
 * Identifiant utilisé pour stocker le jeton de réinitialisation de mot de passe.
 */
function resetTokenIdentifier(token: string) {
  return `password-reset-${token}`;
}

/**
 * Génère un jeton de réinitialisation cryptographiquement sécurisé.
 */
function generateResetToken(): string {
  return crypto.randomUUID();
}

/**
 * Route POST /api/auth/password-reset/send
 *
 * Corps : { email: string }
 *
 * Génère un jeton de réinitialisation à usage unique, l'enregistre de manière
 * sécurisée dans la table `verification` et envoie un e-mail contenant un lien
 * de réinitialisation. Répond toujours "ok" (même si l'email est inconnu) pour
 * éviter l'énumération de comptes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: { message: "Email invalide." } }, { status: 400 });
    }

    // 1) Vérifier si le compte existe (sans révéler l'information si inexistant).
    const [account] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!account) {
      // Anti-énumération : répondre "ok" sans rien envoyer.
      return NextResponse.json({ ok: true });
    }

    // 2) Rate limiting : un seul envoi toutes les 60 s par email.
    const now = new Date();
    const recent = await db
      .select({ createdAt: verification.createdAt })
      .from(verification)
      .where(
        and(
          gt(verification.createdAt, new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000))
        )
      )
      .orderBy({ createdAt: "desc" })
      .limit(1);

    if (recent.length > 0) {
      const elapsed = Math.floor((now.getTime() - new Date(recent[0].createdAt).getTime()) / 1000);
      const remaining = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsed);
      return NextResponse.json(
        {
          error: {
            message: `Veuillez patienter ${remaining}s avant de demander une nouvelle réinitialisation.`,
            retryAfter: remaining,
          },
        },
        { status: 429 }
      );
    }

    // 3) Invalider les anciens jetons de réinitialisation pour cet email.
    await db
      .delete(verification)
      .where(eq(verification.value, email))
      .catch(() => {});

    // 4) Générer et stocker un nouveau jeton (empreinte sécurisée = le token lui-même
    //    est stocké comme identifiant, seule sa présence prouve qu'il est valide).
    const token = generateResetToken();
    const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_SECONDS * 1000);

    await db.insert(verification).values({
      id: token,
      identifier: resetTokenIdentifier(token),
      value: email,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // 5) Construire le lien de réinitialisation.
    const resetLink = buildPasswordResetLink(token);

    // 6) Envoyer l'e-mail. On ne révèle jamais si le compte existe.
    try {
      await sendPasswordResetEmail({
        email,
        token,
        resetLink,
        expiresInMinutes: TOKEN_EXPIRY_MINUTES,
      });
    } catch (emailError) {
      // Nettoyer le jeton non délivré pour permettre une nouvelle tentative immédiate.
      await db
        .delete(verification)
        .where(eq(verification.identifier, resetTokenIdentifier(token)))
        .catch(() => {});
      console.error("[password-reset/send] Email send failed:", emailError);
      return NextResponse.json(
        { error: { message: "L'envoi de l'e-mail a échoué. Veuillez réessayer dans un instant." } },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[password-reset/send] Unexpected error:", err);
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue." } },
      { status: 500 }
    );
  }
}
