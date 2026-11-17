import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { eq, desc, and } from "drizzle-orm";
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
    const limit = parseInt(searchParams.get("limit") || "50", 10);

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
      .where(
        and(
          eq(trafficEvent.userId, session.user.id),
          eq(trafficEvent.eventType, "search")
        )
      )
      .orderBy(desc(trafficEvent.createdAt))
      .limit(limit);

    // Transform traffic events into search history items
    const searches = rows.map((row) => {
      const metadata = row.metadata as SearchMetadata | null;
      return {
        id: row.id,
        brand: metadata?.brand ?? null,
        format: metadata?.format ?? null,
        zone: metadata?.zone ?? null,
        resultsCount: metadata?.resultsCount ?? 0,
        searchedAt: row.createdAt,
      };
    });

    return NextResponse.json({ searches });
  } catch (error) {
    console.error("[GET /api/historique/searches] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique des recherches" },
      { status: 500 }
    );
  }
}