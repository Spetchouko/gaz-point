import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  user,
  verification,
  account,
  session as sessionTable,
} from "@/db/schema";
import { hashPassword } from "better-auth/crypto";
import { validateNewPassword } from "@/lib/password-policy";
import {
  getPasswordResetTokenIdentifiers,
  normalizePasswordResetToken,
} from "@/lib/password-reset";

/**
 * Route POST /api/auth/password-reset/reset
 *
 * Corps : { token: string, newPassword: string }
 *
 * Consomme un jeton de réinitialisation à usage unique, hache le nouveau mot
 * de passe et met à jour le compte credential. Toutes les sessions du compte
 * sont révoquées afin qu'une session antérieure ne reste pas active.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      token?: unknown;
      newPassword?: unknown;
    } | null;

    const token = normalizePasswordResetToken(body?.token);
    if (!token) {
      return NextResponse.json(
        { error: { message: "Jeton de réinitialisation manquant ou invalide." } },
        { status: 400 }
      );
    }

    const passwordError = validateNewPassword(body?.newPassword);
    if (passwordError) {
      return NextResponse.json(
        { error: { message: passwordError } },
        { status: 400 }
      );
    }

    const newPassword = body?.newPassword as string;
    const now = new Date();
    const identifiers = getPasswordResetTokenIdentifiers(token);

    // La suppression conditionnelle réclame le jeton en une seule opération.
    // Un second essai avec le même jeton ne peut donc pas aboutir.
    const [claimed] = await db
      .delete(verification)
      .where(
        and(
          inArray(verification.identifier, identifiers),
          gt(verification.expiresAt, now)
        )
      )
      .returning({
        value: verification.value,
        expiresAt: verification.expiresAt,
      });

    if (!claimed) {
      const [expired] = await db
        .select({ id: verification.id })
        .from(verification)
        .where(
          and(
            inArray(verification.identifier, identifiers),
            lt(verification.expiresAt, now)
          )
        )
        .limit(1);

      if (expired) {
        await db
          .delete(verification)
          .where(eq(verification.id, expired.id))
          .catch(() => undefined);
        return NextResponse.json(
          {
            error: {
              message: "Ce lien de réinitialisation a expiré. Demandez-en un nouveau.",
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: {
            message: "Jeton de réinitialisation invalide ou déjà utilisé.",
          },
        },
        { status: 400 }
      );
    }

    const email = claimed.value.toLowerCase().trim();
    const [userRow] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRow) {
      return NextResponse.json(
        { error: { message: "Utilisateur introuvable." } },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);
    const [credentialAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, userRow.id),
          eq(account.providerId, "credential"),
          eq(account.accountId, userRow.id)
        )
      )
      .limit(1);

    if (credentialAccount) {
      await db
        .update(account)
        .set({ password: hashedPassword, updatedAt: now })
        .where(eq(account.id, credentialAccount.id));
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userRow.id,
        providerId: "credential",
        userId: userRow.id,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.delete(sessionTable).where(eq(sessionTable.userId, userRow.id));
    await db
      .update(user)
      .set({ updatedAt: now })
      .where(eq(user.id, userRow.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[password-reset/reset] Unexpected error:", err);
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue lors de la réinitialisation." } },
      { status: 500 }
    );
  }
}
