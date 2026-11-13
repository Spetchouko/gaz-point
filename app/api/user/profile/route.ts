import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone } = body;

    // Validation
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json({ error: "Le nom doit contenir au moins 2 caractères" }, { status: 400 });
    }

    if (phone !== undefined && phone && typeof phone === "string" && phone.trim().length > 0) {
      const phoneRegex = /^\+?[0-9\s-]{8,}$/;
      if (!phoneRegex.test(phone.trim())) {
        return NextResponse.json({ error: "Format de téléphone invalide" }, { status: 400 });
      }
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    await db.update(user).set(updates).where(eq(user.id, session.user.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/user/profile] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}