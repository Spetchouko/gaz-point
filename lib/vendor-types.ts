/**
 * Types partagés pour l'onboarding vendeur.
 * Utilisés par le schéma de base de données et l'API d'inscription.
 */

export interface VendorInventoryEntry {
  brand: string
  format: string
  quantity: number
}