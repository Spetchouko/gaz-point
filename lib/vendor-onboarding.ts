/**
 * Règles et types partagés du parcours d'inscription vendeur.
 *
 * Ce module est volontairement sans dépendance serveur : il est utilisé à la
 * fois par les formulaires (client) et par les routes/actions (serveur).
 * Les mêmes validations sont ainsi appliquées des deux côtés.
 */

export const MIN_VENDOR_BRANDS = 5
export const MAX_VENDOR_BRANDS = 50
export const MAX_INVENTORY_REFERENCES = 200

/** Ligne d'inventaire telle que saisie / sauvegardée en brouillon. */
export type VendorInventoryEntry = {
  brand: string
  format: string
  quantity: number | string
}

/** Référence validée, prête à être enregistrée. */
export type VendorInventoryReference = {
  brand: string
  format: string
  quantity: number
}

export type VendorPointInfo = {
  pointName: string
  district: string
  address: string
  phone: string | null
}

export type VendorSignupData = {
  name: string
  email: string
  password: string
  district: string
  address: string
  brands: string[]
}

export type OnboardingActionResult = {
  ok: boolean
  message: string
  pointId?: string
}

export type VendorSignupValidation =
  | { ok: true; data: VendorSignupData }
  | {
      ok: false
      message: string
      field?: "name" | "email" | "password" | "district" | "address" | "brands"
    }

export const DISPOSABLE_EMAIL_DOMAINS = [
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "maildrop.cc",
  "sharklasers.com",
  "grr.la",
  "spamgourmet.com",
  "temp-mail.org",
  "fakeinbox.com",
  "dispostable.com",
  "mintemail.com",
] as const

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  return Boolean(
    domain &&
      (DISPOSABLE_EMAIL_DOMAINS as readonly string[]).includes(domain)
  )
}

/** Nettoie un libellé de marque (espaces multiples, bords). */
export function normalizeBrandName(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

/** Clé de comparaison insensible à la casse pour éviter les doublons. */
export function brandKey(value: string): string {
  return normalizeBrandName(value).toLowerCase()
}

export function normalizeFormat(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

/**
 * Déduplique les marques en conservant la première graphie saisie.
 * Les chaînes vides sont ignorées.
 */
export function dedupeBrands(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values) {
    if (typeof raw !== "string") continue
    const name = normalizeBrandName(raw)
    if (!name) continue
    const key = brandKey(name)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(name)
    if (result.length >= MAX_VENDOR_BRANDS) break
  }
  return result
}

/** Convertit une valeur (FormData, JSON, etc.) en lignes d'inventaire brutes. */
export function parseInventoryPayload(raw: unknown): VendorInventoryEntry[] {
  let value = raw
  if (typeof raw === "string") {
    if (!raw.trim()) return []
    try {
      value = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []

  const entries: VendorInventoryEntry[] = []
  for (const item of value.slice(0, MAX_INVENTORY_REFERENCES)) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    entries.push({
      brand: typeof row.brand === "string" ? row.brand : "",
      format: typeof row.format === "string" ? row.format : "",
      quantity:
        typeof row.quantity === "number" || typeof row.quantity === "string"
          ? row.quantity
          : "",
    })
  }
  return entries
}

/**
 * Prépare un brouillon d'inventaire : conserve les lignes partiellement
 * remplies (reprise du formulaire) mais retire les lignes totalement vides.
 */
export function sanitizeInventoryDraft(raw: unknown): VendorInventoryEntry[] {
  return parseInventoryPayload(raw)
    .map((entry) => ({
      brand: normalizeBrandName(entry.brand),
      format: normalizeFormat(entry.format),
      quantity: String(entry.quantity ?? "").trim(),
    }))
    .filter((entry) => entry.brand || entry.format || entry.quantity)
    .slice(0, MAX_INVENTORY_REFERENCES)
}

/**
 * Construit l'inventaire initial de l'étape 2 :
 * - les marques saisies à l'inscription apparaissent toujours ;
 * - les grammages/quantités déjà sauvegardés sont restaurés ;
 * - les marques ajoutées ensuite sont conservées.
 */
export function buildInitialInventory(
  brands: unknown,
  savedInventory?: unknown
): VendorInventoryEntry[] {
  const signupBrands = dedupeBrands(brands)
  const saved = sanitizeInventoryDraft(savedInventory)
  const result: VendorInventoryEntry[] = []

  for (const brand of signupBrands) {
    const matches = saved.filter(
      (entry) => entry.brand && brandKey(entry.brand) === brandKey(brand)
    )
    if (matches.length > 0) {
      result.push(...matches)
    } else {
      result.push({ brand, format: "", quantity: "" })
    }
  }

  const signupKeys = new Set(signupBrands.map((brand) => brandKey(brand)))
  for (const entry of saved) {
    if (!entry.brand || !signupKeys.has(brandKey(entry.brand))) {
      result.push(entry)
    }
  }

  return result.slice(0, MAX_INVENTORY_REFERENCES)
}

/** Valide et nettoie les informations du point de vente (étape 1). */
export function validatePointInfo(input: {
  pointName?: unknown
  district?: unknown
  address?: unknown
  phone?: unknown
}): VendorPointInfo {
  const pointName =
    typeof input.pointName === "string" ? input.pointName.trim() : ""
  const district =
    typeof input.district === "string" ? input.district.trim() : ""
  const address = typeof input.address === "string" ? input.address.trim() : ""
  const phone =
    typeof input.phone === "string" && input.phone.trim()
      ? input.phone.trim()
      : null

  if (pointName.length < 2) {
    throw new Error("Le nom du point de vente doit contenir au moins 2 caractères.")
  }
  if (pointName.length > 100) {
    throw new Error("Le nom du point de vente ne doit pas dépasser 100 caractères.")
  }
  if (district.length < 2) {
    throw new Error("Le quartier doit contenir au moins 2 caractères.")
  }
  if (district.length > 100) {
    throw new Error("Le quartier ne doit pas dépasser 100 caractères.")
  }
  if (address.length < 5) {
    throw new Error("L'adresse (rue et repères) doit contenir au moins 5 caractères.")
  }
  if (address.length > 300) {
    throw new Error("L'adresse ne doit pas dépasser 300 caractères.")
  }

  return { pointName, district, address, phone }
}

/**
 * Valide l'inventaire avant la création définitive du point de vente.
 * Exige au moins 5 marques différentes, un grammage et une quantité réelle
 * pour chaque référence, et refuse les doublons marque + grammage.
 */
export function validateInventoryForFinalization(
  raw: unknown
): VendorInventoryReference[] {
  const entries = parseInventoryPayload(raw)
  const references: VendorInventoryReference[] = []
  const seenReferences = new Set<string>()
  const brands = new Set<string>()

  for (const entry of entries) {
    const brand = normalizeBrandName(entry.brand)
    const format = normalizeFormat(entry.format)
    const quantityRaw = String(entry.quantity ?? "").trim()

    if (!brand && !format && !quantityRaw) continue

    if (!brand) {
      throw new Error("Renseignez la marque de chaque référence de bouteille.")
    }
    if (!format) {
      throw new Error(`Renseignez le grammage pour « ${brand} ».`)
    }
    if (!quantityRaw) {
      throw new Error(`Renseignez la quantité pour « ${brand} — ${format} ».`)
    }
    if (!/^\d+$/.test(quantityRaw)) {
      throw new Error(
        `La quantité de « ${brand} — ${format} » doit être un nombre entier positif ou nul.`
      )
    }

    const quantity = Number(quantityRaw)
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error(
        `La quantité de « ${brand} — ${format} » doit être un nombre entier positif ou nul.`
      )
    }

    const referenceKey = `${brandKey(brand)}|${format.toLowerCase()}`
    if (seenReferences.has(referenceKey)) {
      throw new Error(`La référence « ${brand} — ${format} » est en double.`)
    }
    seenReferences.add(referenceKey)
    brands.add(brandKey(brand))
    references.push({ brand, format, quantity })
  }

  if (references.length === 0) {
    throw new Error("Ajoutez au moins une référence de bouteille à votre inventaire.")
  }
  if (brands.size < MIN_VENDOR_BRANDS) {
    throw new Error(
      `Ajoutez au moins ${MIN_VENDOR_BRANDS} marques différentes avant de finaliser votre point de vente.`
    )
  }
  if (references.length > MAX_INVENTORY_REFERENCES) {
    throw new Error(
      `L'inventaire ne peut pas dépasser ${MAX_INVENTORY_REFERENCES} références.`
    )
  }

  return references
}

/** Valide la charge utile de l'inscription vendeur côté serveur. */
export function validateVendorSignupPayload(raw: unknown): VendorSignupValidation {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Données d'inscription invalides." }
  }
  const body = raw as Record<string, unknown>

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const district =
    typeof body.district === "string" ? body.district.trim() : ""
  const address = typeof body.address === "string" ? body.address.trim() : ""
  const brands = dedupeBrands(body.brands)

  if (name.length < 2) {
    return {
      ok: false,
      field: "name",
      message: "Le nom du point de vente doit contenir au moins 2 caractères.",
    }
  }
  if (name.length > 100) {
    return {
      ok: false,
      field: "name",
      message: "Le nom du point de vente ne doit pas dépasser 100 caractères.",
    }
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, field: "email", message: "Format d'email invalide." }
  }
  if (isDisposableEmail(email)) {
    return {
      ok: false,
      field: "email",
      message: "Les emails temporaires ne sont pas autorisés.",
    }
  }
  if (password.length < 6) {
    return {
      ok: false,
      field: "password",
      message: "Le mot de passe doit contenir au moins 6 caractères.",
    }
  }
  if (password.length > 128) {
    return {
      ok: false,
      field: "password",
      message: "Le mot de passe ne doit pas dépasser 128 caractères.",
    }
  }
  if (district.length < 2) {
    return {
      ok: false,
      field: "district",
      message: "Le quartier doit contenir au moins 2 caractères.",
    }
  }
  if (district.length > 100) {
    return {
      ok: false,
      field: "district",
      message: "Le quartier ne doit pas dépasser 100 caractères.",
    }
  }
  if (address.length < 5) {
    return {
      ok: false,
      field: "address",
      message: "L'adresse (rue et repères) doit contenir au moins 5 caractères.",
    }
  }
  if (address.length > 300) {
    return {
      ok: false,
      field: "address",
      message: "L'adresse ne doit pas dépasser 300 caractères.",
    }
  }
  if (brands.length < MIN_VENDOR_BRANDS) {
    return {
      ok: false,
      field: "brands",
      message: `Renseignez au moins ${MIN_VENDOR_BRANDS} marques de bouteilles différentes.`,
    }
  }

  return {
    ok: true,
    data: { name, email, password, district, address, brands },
  }
}
