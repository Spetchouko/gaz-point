import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Taille maximale autorisée pour un avatar (2 Mo). */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** MIME types autorisés pour un avatar. */
const AVATAR_ACCEPTED_MIME: readonly string[] = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

function extractDataUrlInfo(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), base64: match[2].replace(/\s/g, "") };
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { image, remove } = body;

    // Suppression de l'avatar
    if (remove === true) {
      await db.update(user).set({ image: null }).where(eq(user.id, session.user.id));
      return NextResponse.json({ ok: true, image: null });
    }

    // Aucune image fournie
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    }

    // Vide = suppression
    if (!image.trim()) {
      await db.update(user).set({ image: null }).where(eq(user.id, session.user.id));
      return NextResponse.json({ ok: true, image: null });
    }

    // Validation du format data-URL
    const info = extractDataUrlInfo(image);
    if (!info) {
      return NextResponse.json(
        { error: "Format d'image invalide. Utilisez JPG, JPEG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (!AVATAR_ACCEPTED_MIME.includes(info.mime as any)) {
      return NextResponse.json(
        { error: "Format d'image non pris en charge. Utilisez JPG, JPEG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Estimation du poids réel décodé (base64 → bytes)
    const bytes = Math.floor((info.base64.length * 3) / 4);
    if (bytes > AVATAR_MAX_BYTES) {
      return NextResponse.json(
        { error: `Image trop lourde (${Math.round(bytes / 1024)} Ko, 2 Mo maximum).` },
        { status: 400 }
      );
    }

    await db.update(user).set({ image }).where(eq(user.id, session.user.id));

    return NextResponse.json({ ok: true, image });
  } catch (error) {
    console.error("[PATCH /api/user/avatar] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'avatar" }, { status: 500 });
  }
}
