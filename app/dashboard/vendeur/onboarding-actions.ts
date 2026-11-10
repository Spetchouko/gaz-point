"use server"

import { revalidatePath } from "next/cache"
import { requirePro } from "@/lib/session"
import { normalizePhone } from "@/lib/phone"
import {
  parseInventoryPayload,
  sanitizeInventoryDraft,
  type OnboardingActionResult,
} from "@/lib/vendor-onboarding"
import {
  finalizePointForUser,
  saveInventoryDraftForUser,
  savePointInfoForUser,
} from "@/lib/vendor-onboarding-service"

/**
 * Actions serveur du parcours d'onboarding vendeur.
 *
 * Toutes les actions exigent une session vendeur authentifiée. Aucune donnée
 * n'est écrite tant que le compte n'a pas d'email vérifié (et une session ne
 * peut pas exister pour un compte non vérifié).
 */

async function requireVerifiedVendor() {
  const { user, role } = await requirePro()
  if (role !== "vendor") {
    throw new Error("Action réservée aux vendeurs.")
  }
  if (!user.emailVerified) {
    throw new Error("Vérifiez votre adresse email avant de continuer.")
  }
  return user
}

function revalidateVendorPaths() {
  revalidatePath("/dashboard/vendeur")
  revalidatePath("/dashboard/vendeur/points-de-vente")
  revalidatePath("/dashboard/vendeur/mes-bouteilles")
}

/** Étape 1 — informations du dépôt (nom, quartier, adresse). */
export async function saveVendorPointInfo(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  try {
    const user = await requireVerifiedVendor()

    const phoneRaw = String(formData.get("phone") ?? "").trim()
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null
    if (phoneRaw && !phone) {
      return {
        ok: false,
        message:
          "Format de téléphone invalide. Le numéro doit contenir 9 chiffres (ex: 690123456).",
      }
    }

    await savePointInfoForUser(user.id, {
      pointName: String(formData.get("pointName") ?? ""),
      district: String(formData.get("district") ?? ""),
      address: String(formData.get("address") ?? ""),
      phone,
    })

    revalidateVendorPaths()
    return { ok: true, message: "Informations du point de vente enregistrées." }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer les informations du point de vente.",
    }
  }
}

/**
 * Étape 2 — sauvegarde progressive de l'inventaire.
 *
 * Accepte les lignes partiellement remplies (brouillon) ou complètes
 * (validation avant finalisation).
 */
export async function saveVendorInventoryDraft(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  try {
    const user = await requireVerifiedVendor()
    const inventory = sanitizeInventoryDraft(parseInventoryPayload(formData.get("inventory")))
    await saveInventoryDraftForUser(user.id, inventory)
    revalidateVendorPaths()
    return { ok: true, message: "Inventaire enregistré." }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer l'inventaire.",
    }
  }
}

/** Étape 3 — création (ou mise à jour idempotente) du point de vente. */
export async function finalizeVendorPoint(
  _prev: OnboardingActionResult | null,
  formData: FormData
): Promise<OnboardingActionResult> {
  try {
    const user = await requireVerifiedVendor()

    const phoneRaw = String(formData.get("phone") ?? "").trim()
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null
    if (phoneRaw && !phone) {
      return {
        ok: false,
        message:
          "Format de téléphone invalide. Le numéro doit contenir 9 chiffres (ex: 690123456).",
      }
    }

    const { pointId } = await finalizePointForUser(user.id, {
      point: {
        pointName: String(formData.get("pointName") ?? ""),
        district: String(formData.get("district") ?? ""),
        address: String(formData.get("address") ?? ""),
        phone,
      },
      inventory: parseInventoryPayload(formData.get("inventory")),
    })

    revalidateVendorPaths()
    revalidatePath("/")
    return {
      ok: true,
      pointId,
      message: "Votre point de vente est prêt à gérer vos bouteilles.",
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de finaliser le point de vente.",
    }
  }
}
