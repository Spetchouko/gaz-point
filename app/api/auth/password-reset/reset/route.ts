import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user, verification, account } from "@/db/schema";
import { hashPassword } from "better-auth/crypto";

/**
 * Route POST /api/auth/password-reset/reset
 *
 * Corps : { token: string, newPassword: string }
 *
 * Vérifie le jeton de réinitialisation, hache le nouveau mot de passe et met à
 * jour le compte utilisateur. Le jeton est à usage unique et est supprimé après
 * utilisation réussie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: { message: "Jeton de réinitialisation manquant." } }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: { message: "Nouveau mot de passe manquant." } }, { status: 400 });
    }

    // Validation de la complexité du nouveau mot de passe.
    if (newPassword.length < 8) {
      return NextResponse.json({ error: { message: "Le mot de passe doit contenir au moins 8 caractères." } }, { status: 400 });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: { message: "Le mot de passe doit contenir au moins une majuscule (A-Z)." } }, { status: 400 });
    }
    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json({ error: { message: "Le mot de passe doit contenir au moins une minuscule (a-z)." } }, { status: 400 });
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: { message: "Le mot de passe doit contenir au moins un chiffre (0-9)." } }, { status: 400 });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return NextResponse.json({ error: { message: "Le mot de passe doit contenir au moins un caractère spécial." } }, { status: 400 });
    }

    // 1) Récupérer l'enregistrement de vérification associé au jeton.
    const [record] = await db
      .select({ value: verification.value, expiresAt: verification.expiresAt })
      .from(verification)
      .where(eq(verification.identifier, `password-reset-${token}`))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: { message: "Jeton de réinitialisation invalide ou déjà utilisé." } }, { status: 400 });
    }

    // 2) Vérifier l'expiration.
    const now = new Date();
    if (new Date(record.expiresAt) < now) {
      // Supprimer le jeton expiré.
      await db
        .delete(verification)
        .where(eq(verification.identifier, `password-reset-${token}`))
        .catch(() => {});
      return NextResponse.json({ error: { message: "Ce lien de réinitialisation a expiré. Demandez-en un nouveau." } }, { status: 400 });
    }

    const email = record.value;

    // 3) Récupérer l'utilisateur associé.
    const [userRow] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRow) {
      await db
        .delete(verification)
        .where(eq(verification.identifier, `password-reset-${token}`))
        .catch(() => {});
      return NextResponse.json({ error: { message: "Utilisateur introuvable." } }, { status: 400 });
    }

    // 4) Hacher le nouveau mot de passe avec le même algorithme que Better Auth.
    const hashedPassword = await hashPassword(newPassword);

    // 5) Mettre à jour ou créer le compte credential (mot de passe local).
    const [existingAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, userRow.id))
      .limit(1);

    if (existingAccount) {
      await db
        .update(account)
        .set({ password: hashedPassword, updatedAt: now })
        .where(eq(account.id, existingAccount.id));
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userRow.email,
        providerId: "credential",
        userId: userRow.id,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 6) Supprimer le jeton utilisé (usage unique).
    await db
      .delete(verification)
      .where(eq(verification.identifier, `password-reset-${token}`))
      .catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[password-reset/reset] Unexpected error:", err);
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue lors de la réinitialisation." } },
      { status: 500 }
    );
  }
}
