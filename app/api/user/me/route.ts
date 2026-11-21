import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withTransientRetry } from "@/lib/transient-retry";

export async function GET(req: NextRequest) {
  // Une erreur réseau transitoire ne doit pas être confondue avec une session
  // absente : le dashboard ne redirige que sur un 401 explicite.
  const session = await withTransientRetry(() =>
    auth.api.getSession({ headers: req.headers })
  );

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const [row] = await withTransientRetry(() =>
      db
        .select({ id: user.id, name: user.name, email: user.email, phoneNumber: user.phoneNumber, image: user.image, role: user.role, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, emailVerified: user.emailVerified })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1)
    );

    if (!row) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ user: row });
  } catch (error) {
    console.error("[GET /api/user/me] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération du profil" }, { status: 500 });
  }
}
