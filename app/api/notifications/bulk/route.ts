import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type BulkAction =
  | "mark-read"
  | "mark-unread"
  | "archive"
  | "restore"
  | "delete"
  | "mark-all-read";

const BULK_ACTIONS: BulkAction[] = [
  "mark-read",
  "mark-unread",
  "archive",
  "restore",
  "delete",
  "mark-all-read",
];

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, ids } = body as { action?: unknown; ids?: unknown };

    if (typeof action !== "string" || !BULK_ACTIONS.includes(action as BulkAction)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const isMarkAll = action === "mark-all-read";
    if (
      !isMarkAll &&
      (!Array.isArray(ids) ||
        ids.length === 0 ||
        ids.length > 500 ||
        ids.some((id) => typeof id !== "string" || id.length === 0))
    ) {
      return NextResponse.json(
        { error: "Action et liste d'IDs requises" },
        { status: 400 }
      );
    }

    const safeIds = isMarkAll ? [] : (ids as string[]);
    const baseConditions = [eq(notification.userId, session.user.id)];

    if (action === "mark-all-read") {
      const updated = await db
        .update(notification)
        .set({ read: true, updatedAt: new Date() })
        .where(
          and(
            ...baseConditions,
            eq(notification.archived, false),
            eq(notification.read, false)
          )
        )
        .returning({ id: notification.id });

      return NextResponse.json({
        ok: true,
        action,
        count: updated.length,
      });
    }

    if (action === "delete") {
      const deleted = await db
        .delete(notification)
        .where(and(...baseConditions, inArray(notification.id, safeIds)))
        .returning({ id: notification.id });

      return NextResponse.json({
        ok: true,
        action,
        count: deleted.length,
      });
    }

    const updates: Record<string, unknown> = {};
    if (action === "mark-read") updates.read = true;
    if (action === "mark-unread") updates.read = false;
    if (action === "archive") updates.archived = true;
    if (action === "restore") updates.archived = false;
    updates.updatedAt = new Date();

    const updated = await db
      .update(notification)
      .set(updates)
      .where(and(...baseConditions, inArray(notification.id, safeIds)))
      .returning({ id: notification.id });

    return NextResponse.json({
      ok: true,
      action,
      count: updated.length,
    });
  } catch (error) {
    console.error("[POST /api/notifications/bulk] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action groupée" },
      { status: 500 }
    );
  }
}
