import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        read: notification.read,
        archived: notification.archived,
        createdAt: notification.createdAt,
      })
      .from(notification)
      .where(eq(notification.userId, session.user.id))
      .orderBy(desc(notification.createdAt), desc(notification.id))
      .limit(10000);

    return NextResponse.json({ notifications: rows });
  } catch (error) {
    console.error("[GET /api/notifications/export] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export des notifications" },
      { status: 500 }
    );
  }
}
