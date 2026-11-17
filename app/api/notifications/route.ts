import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and, desc, ilike, or, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";

type NotificationType = "reservation" | "availability" | "system" | "promo" | "admin";

interface CreateNotificationBody {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body: CreateNotificationBody = await req.json();
    const { userId, type, title, message, link } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title et message sont requis" },
        { status: 400 }
      );
    }

    // Sécurité : un utilisateur ne peut créer des notifications que pour lui-même,
    // sauf si c'est un administrateur qui crée pour un autre utilisateur.
    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Non autorisé à créer une notification pour cet utilisateur" },
        { status: 403 }
      );
    }

    await db.insert(notification).values({
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      link: link ?? null,
      read: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get("archived");
    const readParam = searchParams.get("read");
    const search = searchParams.get("search")?.trim() || null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const conditions = [eq(notification.userId, session.user.id)];

    // Filtrage archivé / non archivé
    if (archivedParam === "true") {
      conditions.push(eq(notification.archived, true));
    } else if (archivedParam === "false") {
      conditions.push(eq(notification.archived, false));
    }

    // Filtrage lu / non lu
    if (readParam === "true") {
      conditions.push(eq(notification.read, true));
    } else if (readParam === "false") {
      conditions.push(eq(notification.read, false));
    }

    // Recherche textuelle
    if (search) {
      conditions.push(
        or(
          ilike(notification.title, `%${search}%`),
          ilike(notification.message, `%${search}%`)
        )
      );
    }

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
        updatedAt: notification.updatedAt,
      })
      .from(notification)
      .where(and(...conditions))
      .orderBy(desc(notification.createdAt))
      .limit(limit);

    // Compteur non lus (toujours sur les non-archivés)
    const [unreadResult] = await db
      .select({ c: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, session.user.id),
          eq(notification.archived, false),
          eq(notification.read, false)
        )
      );

    return NextResponse.json({
      notifications: rows,
      unreadCount: Number(unreadResult?.c || 0),
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, read, archived } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID de notification requis" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (read !== undefined) updates.read = Boolean(read);
    if (archived !== undefined) updates.archived = Boolean(archived);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucune mise à jour fournie" }, { status: 400 });
    }

    const [updated] = await db
      .update(notification)
      .set(updates)
      .where(
        and(eq(notification.id, id), eq(notification.userId, session.user.id))
      )
      .returning({ id: notification.id });

    if (!updated) {
      return NextResponse.json({ error: "Notification introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (error) {
    console.error("[PATCH /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}
