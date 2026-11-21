import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { eq, desc, and, inArray, count } from "drizzle-orm";
import { trafficEvent } from "@/db/schema";

interface SearchMetadata {
  brand?: string;
  format?: string;
  zone?: string;
  resultsCount?: number;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
    );
    const pageSize = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(
          searchParams.get("pageSize") ?? searchParams.get("limit") ?? "50",
          10
        ) || 50
      )
    );

    const where = and(
      eq(trafficEvent.userId, session.user.id),
      inArray(trafficEvent.eventType, ["search_performed", "search"])
    );

    const totalResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(where);

    const total = totalResult[0]?.count ?? 0;

    const rows = await db
      .select({
        id: trafficEvent.id,
        eventType: trafficEvent.eventType,
        path: trafficEvent.path,
        referrer: trafficEvent.referrer,
        metadata: trafficEvent.metadata,
        createdAt: trafficEvent.createdAt,
      })
      .from(trafficEvent)
      .where(where)
      .orderBy(desc(trafficEvent.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform traffic events into search history items. Les anciennes lignes
    // peuvent contenir un JSON sérialisé, les nouvelles un objet JSONB.
    const searches = rows.map((row) => {
      let rawMetadata: unknown = row.metadata;
      if (typeof rawMetadata === "string") {
        try {
          rawMetadata = JSON.parse(rawMetadata);
        } catch {
          rawMetadata = null;
        }
      }

      const metadata =
        rawMetadata && typeof rawMetadata === "object"
          ? (rawMetadata as SearchMetadata)
          : null;

      return {
        id: row.id,
        brand: metadata?.brand ?? null,
        format: metadata?.format ?? null,
        zone: metadata?.zone ?? null,
        resultsCount: metadata?.resultsCount ?? 0,
        searchedAt: row.createdAt,
      };
    });

    return NextResponse.json({
      searches,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[GET /api/historique/searches] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique des recherches" },
      { status: 500 }
    );
  }
}