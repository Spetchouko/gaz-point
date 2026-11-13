import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
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