import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, trafficEvent } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // L'historique de recherche est un historique lié au compte. Il doit
    // être supprimé explicitement, car la clé étrangère le laisserait sinon
    // sans identifiant utilisateur après la suppression.
    await db
      .delete(trafficEvent)
      .where(
        and(
          eq(trafficEvent.userId, session.user.id),
          eq(trafficEvent.eventType, "search")
        )
      );

    // Delete user data (cascades will handle related records)
    await db.delete(user).where(eq(user.id, session.user.id));

    // Sign out
    await auth.api.signOut({ headers: req.headers });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/user/account] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression du compte" }, { status: 500 });
  }
}