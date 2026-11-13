import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Mot de passe actuel et nouveau mot de passe requis" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }

    try {
      await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        headers: req.headers,
      });

      return NextResponse.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors du changement de mot de passe";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } catch (error) {
    console.error("[POST /api/user/password] Error:", error);
    return NextResponse.json({ error: "Erreur lors du changement de mot de passe" }, { status: 500 });
  }
}