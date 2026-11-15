import { db } from "@/db";
import { notification } from "@/db/schema";
import { randomUUID } from "node:crypto";

export type NotificationType = "reservation" | "availability" | "system" | "admin";

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
 */
export function buildNotificationLink(
  type: NotificationType,
  referenceId?: string | null,
  targetType?: "reservation" | "point" | "disponibilite" | "profil" | "admin"
): string | null {
  switch (targetType) {
    case "reservation":
      return `/dashboard/reservations/${referenceId ?? ""}`;
    case "point":
      return `/dashboard/depot/${referenceId ?? ""}`;
    case "disponibilite":
      return `/dashboard/depot/disponibilites`;
    case "profil":
      return "/dashboard/profil";
    case "admin":
      return `/dashboard/admin/${referenceId ?? ""}`;
    default:
      return null;
  }
}
