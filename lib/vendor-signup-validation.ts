/**
 * Validation partagée pour l'inscription vendeur.
 * Utilisée côté client (page d'inscription) et côté serveur (API /api/vendor/signup).
 */

export type VendorSignupPayload = {
  name: string
  email: string
  password: string
  district: string
  address: string
  brands: string[]
}

type ValidationError = {
  ok: false
  message: string
  field?: keyof VendorSignupPayload
  data?: never
}

type ValidationSuccess = {
  ok: true
  message: string
  field?: never
  data: VendorSignupPayload
}

export type ValidationResult = ValidationError | ValidationSuccess

export function validateVendorSignupPayload(
  payload: unknown
): ValidationResult {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Données invalides.", field: "name" }
  }

  const data = payload as Record<string, unknown>

  // Nom du point de vente (requis, 2-100 caractères)
  const name = data.name
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return {
      ok: false,
      message: "Le nom du point de vente doit contenir entre 2 et 100 caractères.",
      field: "name",
    }
  }

  // Email (requis, format valide)
  const email = data.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof email !== "string" || !emailRegex.test(email)) {
    return {
      ok: false,
      message: "Adresse email invalide.",
      field: "email",
    }
  }

  // Mot de passe (requis, 6+ caractères)
  const password = data.password
  if (typeof password !== "string" || password.length < 6) {
    return {
      ok: false,
      message: "Le mot de passe doit contenir au moins 6 caractères.",
      field: "password",
    }
  }

  // Quartier (requis, 2-80 caractères)
  const district = data.district
  if (typeof district !== "string" || district.trim().length < 2 || district.trim().length > 80) {
    return {
      ok: false,
      message: "Le quartier doit contenir entre 2 et 80 caractères.",
      field: "district",
    }
  }

  // Adresse (requise, 5-200 caractères)
  const address = data.address
  if (typeof address !== "string" || address.trim().length < 5 || address.trim().length > 200) {
    return {
      ok: false,
      message: "L'adresse doit contenir entre 5 et 200 caractères.",
      field: "address",
    }
  }

  // Marques (array de strings, max 5, chaque 1-50 caractères)
  const brands = data.brands
  if (!Array.isArray(brands)) {
    return {
      ok: false,
      message: "La liste des marques est invalide.",
      field: "brands",
    }
  }
  const validBrands = brands
    .map((b) => (typeof b === "string" ? b.trim() : ""))
    .filter((b) => b.length > 0)
  if (validBrands.length === 0) {
    return {
      ok: false,
      message: "Au moins une marque est requise.",
      field: "brands",
    }
  }
  if (validBrands.length > 5) {
    return {
      ok: false,
      message: "Maximum 5 marques autorisées.",
      field: "brands",
    }
  }
  for (const brand of validBrands) {
    if (brand.length > 50) {
      return {
        ok: false,
        message: "Chaque marque doit faire maximum 50 caractères.",
        field: "brands",
      }
    }
  }

  return {
    ok: true,
    message: "Validation réussie.",
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      district: district.trim(),
      address: address.trim(),
      brands: validBrands,
    },
  }
}