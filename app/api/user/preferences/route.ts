import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userPreference } from "@/db/schema";
import { eq } from "drizzle-orm";

type Prefs = {
  notifyReservations: boolean;
  notifyAvailability: boolean;
  notifySystem: boolean;
  notifyMarketing: boolean;
  themePreference: "light" | "dark" | "system";
};

const defaults: Prefs = {
  notifyReservations: true,
  notifyAvailability: true,
  notifySystem: true,
  notifyMarketing: false,
  themePreference: "system",
};

function normalizeTheme(value: unknown): Prefs["themePreference"] {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const [row] = await db
      .select()
      .from(userPreference)
      .where(eq(userPreference.userId, session.user.id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ preferences: defaults });
    }

    return NextResponse.json({
      preferences: {
        notifyReservations: row.notifyReservations,
        notifyAvailability: row.notifyAvailability,
        notifySystem: row.notifySystem,
        notifyMarketing: row.notifyMarketing,
        themePreference: normalizeTheme(row.themePreference),
      } satisfies Prefs,
    });
  } catch (error) {
    console.error("[GET /api/user/preferences] Error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement des préférences" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const next: Prefs = {
      notifyReservations:
        typeof body.notifyReservations === "boolean" ? body.notifyReservations : defaults.notifyReservations,
      notifyAvailability:
        typeof body.notifyAvailability === "boolean" ? body.notifyAvailability : defaults.notifyAvailability,
      notifySystem: typeof body.notifySystem === "boolean" ? body.notifySystem : defaults.notifySystem,
      notifyMarketing:
        typeof body.notifyMarketing === "boolean" ? body.notifyMarketing : defaults.notifyMarketing,
      themePreference: normalizeTheme(body.themePreference),
    };

    await db
      .insert(userPreference)
      .values({
        userId: session.user.id,
        ...next,
      })
      .onConflictDoUpdate({
        target: userPreference.userId,
        set: {
          ...next,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true, preferences: next });
  } catch (error) {
    console.error("[PATCH /api/user/preferences] Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement des préférences" }, { status: 500 });
  }
}
