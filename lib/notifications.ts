import { db } from "@/db";
import { notification } from "@/db/schema";
import { randomUUID } from "node:crypto";

export type NotificationType =
  | "reservation"
  | "availability"
  | "system"
  | "promo"
  | "admin";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

/**
 * Crée une notification côté serveur à partir d'un événement métier réel.
 * Cette fonction est appelée uniquement lorsqu'un événement réel se produit
 * (réservation, changement de statut, disponibilité, action admin, etc.).
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    await db.insert(notification).values({
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      read: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("[createNotification] error:", error);
  }
}

/**
 * Destinations de notification par type d'événement.
 * Chaque notification possède une destination réelle et cohérente.
 * Note: Les pages de détail individuelles n'existant pas encore, les liens renvoient
 * vers les pages de liste avec un paramètre de recherche quand possible.
 */
export function buildNotificationLink(
  type: NotificationType,
  referenceId?: string | null,
  targetType?: "reservation" | "point" | "disponibilite" | "profil" | "admin" | "vendor-reservations" | "client-reservations"
): string | null {
  switch (targetType) {
    case "reservation":
    case "client-reservations":
      // Page liste des réservations client avec deep link vers la réservation
      return referenceId
        ? `/dashboard/reservations?reservation=${encodeURIComponent(referenceId)}`
        : "/dashboard/reservations";
    case "vendor-reservations":
      // Page liste des réservations vendeur avec recherche par code
      return referenceId ? `/dashboard/depot/reservations?search=${encodeURIComponent(referenceId)}` : "/dashboard/depot/reservations";
    case "point":
      return referenceId
        ? `/dashboard/admin/points-de-vente/${referenceId}`
        : "/dashboard/admin/points-de-vente";
    case "disponibilite":
      return "/dashboard/depot/disponibilites";
    case "profil":
      return "/dashboard/vendeur/profil";
    case "admin":
      return referenceId ? `/dashboard/admin/${referenceId}` : "/dashboard/admin";
    default:
      return null;
  }
}
