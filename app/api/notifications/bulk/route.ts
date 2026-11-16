import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type BulkAction = "mark-read" | "mark-unread" | "archive" | "restore" | "delete";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, ids } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Action et liste d'IDs requises" },
        { status: 400 }
      );
    }

    if (!["mark-read", "mark-unread", "archive", "restore", "delete"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const baseConditions = [eq(notification.userId, session.user.id)];

    if (action === "delete") {
      await db
        .delete(notification)
        .where(
          and(
            ...baseConditions,
            inArray(notification.id, ids as string[])
          )
        );
    } else {
      const updates: Record<string, unknown> = {};
      if (action === "mark-read") updates.read = true;
      if (action === "mark-unread") updates.read = false;
      if (action === "archive") updates.archived = true;
      if (action === "restore") updates.archived = false;

      await db
        .update(notification)
        .set(updates)
        .where(
          and(
            ...baseConditions,
            inArray(notification.id, ids as string[])
          )
        );
    }

    return NextResponse.json({ ok: true, action, count: ids.length });
  } catch (error) {
    console.error("[POST /api/notifications/bulk] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action groupée" },
      { status: 500 }
    );
  }
}
