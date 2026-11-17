import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID de notification requis" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(notification)
      .where(and(eq(notification.id, id), eq(notification.userId, session.user.id)))
      .returning({ id: notification.id });

    if (!deleted) {
      return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error("[DELETE /api/notifications/[id]] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}
