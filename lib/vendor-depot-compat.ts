import { sql } from "drizzle-orm"
import { db } from "@/db"

/**
 * Compatibilité entre le schéma Drizzle et la base Neon réellement déployée.
 *
 * Le schéma Drizzle déclare des colonnes qui n'ont jamais été migrées dans
 * Neon (`exchange_fee`, `gas_sale_fee`, `gas_sale_brands`, `gas_sale_formats`,
 * `latitude`, `longitude`). Toute requête générée par Drizzle qui les mentionne
 * échoue avec « column ... does not exist », ce qui provoquait soit un écran
 * d'erreur générique, soit des statistiques vendeur à zéro.
 *
 * Le schéma de la base ne doit pas être modifié : on lit donc la table avec
 * `SELECT *` (qui ne nomme aucune colonne) et on filtre les champs en écriture
 * selon les colonnes réellement présentes. La liste est détectée une seule fois
 * et mise en cache ; dès que les colonnes seront migrées, elles seront réutilisées
 * automatiquement sans nouvelle modification de code.
 */

type RawRow = Record<string, unknown>

const DEPOT_FIELD_TO_COLUMN: Record<string, string> = {
  id: "id",
  name: "name",
  district: "district",
  address: "address",
  phone: "phone",
  brands: "brands",
  formats: "formats",
  latitude: "latitude",
  longitude: "longitude",
  deliveryEnabled: "delivery_enabled",
  deliveryFee: "delivery_fee",
  exchangeEnabled: "exchange_enabled",
  exchangeFee: "exchange_fee",
  exchangeBrands: "exchange_brands",
  exchangeFormats: "exchange_formats",
  gasSaleEnabled: "gas_sale_enabled",
  gasSaleFee: "gas_sale_fee",
  gasSaleBrands: "gas_sale_brands",
  gasSaleFormats: "gas_sale_formats",
  vendorId: "vendor_id",
  isActive: "is_active",
  createdAt: "created_at",
  updatedAt: "updated_at",
}

/** Jeu minimal de colonnes à utiliser si l'introspection échoue. */
const FALLBACK_COLUMNS = new Set([
  "id",
  "name",
  "district",
  "address",
  "phone",
  "brands",
  "formats",
  "vendor_id",
  "is_active",
  "created_at",
  "updated_at",
  "delivery_enabled",
  "delivery_fee",
  "exchange_enabled",
  "exchange_brands",
  "exchange_formats",
  "gas_sale_enabled",
])

let columnsPromise: Promise<Set<string>> | null = null

function rowsOf(result: unknown): RawRow[] {
  const rows = (result as { rows?: unknown } | null)?.rows
  return Array.isArray(rows) ? (rows as RawRow[]) : []
}

export async function getSupportedDepotColumns(): Promise<Set<string>> {
  columnsPromise ??= (async () => {
    try {
      const result = await db.execute(
        sql`select column_name from information_schema.columns where table_name = 'point_de_vente'`
      )
      const names = rowsOf(result)
        .map((row) => row.column_name)
        .filter((value): value is string => typeof value === "string")

      if (names.length === 0) throw new Error("aucune colonne retournée par information_schema")
      return new Set(names)
    } catch (error) {
      // Ne pas transformer une panne d'introspection en panne du dashboard :
      // on utilise le jeu de colonnes connu comme sûr et on journalise la cause.
      console.warn(
        "[depot-compat] introspection impossible, utilisation des colonnes minimales:",
        error instanceof Error ? error.message : String(error)
      )
      return new Set(FALLBACK_COLUMNS)
    }
  })()

  return columnsPromise
}

/** Retire des valeurs à écrire les champs dont la colonne n'existe pas en base. */
export async function filterSupportedDepotFields<T extends Record<string, unknown>>(
  values: T
): Promise<Partial<T>> {
  const columns = await getSupportedDepotColumns()
  const filtered: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(values)) {
    const column = DEPOT_FIELD_TO_COLUMN[key]
    if (!column) continue

    if (!columns.has(column)) {
      const hasValue = value !== undefined && value !== null && value !== ""
      const isNonEmptyArray = Array.isArray(value) && value.length > 0
      if (hasValue || isNonEmptyArray) {
        console.warn(
          `[depot-compat] champ "${key}" ignoré : la colonne "${column}" n'existe pas dans Neon`
        )
      }
      continue
    }

    filtered[key] = value
  }

  return filtered as Partial<T>
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return new Date(0).toISOString()
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function asNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

/** Convertit une ligne brute (noms de colonnes SQL) en DTO utilisé par le dashboard. */
export function normalizeDepotRow(row: RawRow) {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    district: String(row.district ?? ""),
    address: String(row.address ?? ""),
    phone: typeof row.phone === "string" ? row.phone : null,
    brands: asStringArray(row.brands),
    formats: asStringArray(row.formats),
    deliveryEnabled: Boolean(row.delivery_enabled),
    deliveryFee: asNumber(row.delivery_fee),
    exchangeEnabled: Boolean(row.exchange_enabled),
    exchangeFee: row.exchange_fee == null ? null : asNumber(row.exchange_fee),
    exchangeBrands: asStringArray(row.exchange_brands),
    exchangeFormats: asStringArray(row.exchange_formats),
    gasSaleEnabled: Boolean(row.gas_sale_enabled),
    gasSaleFee: row.gas_sale_fee == null ? null : asNumber(row.gas_sale_fee),
    gasSaleBrands: asStringArray(row.gas_sale_brands),
    gasSaleFormats: asStringArray(row.gas_sale_formats),
    vendorId: String(row.vendor_id ?? ""),
    isActive: Boolean(row.is_active),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

export type VendorDepotRecord = ReturnType<typeof normalizeDepotRow>

export async function getDepotRowsByVendorId(vendorId: string): Promise<VendorDepotRecord[]> {
  const result = await db.execute(
    sql`select * from point_de_vente where vendor_id = ${vendorId} order by created_at desc`
  )
  return rowsOf(result).map(normalizeDepotRow)
}

export async function getDepotRowById(id: string): Promise<VendorDepotRecord | null> {
  const result = await db.execute(sql`select * from point_de_vente where id = ${id} limit 1`)
  const row = rowsOf(result)[0]
  return row ? normalizeDepotRow(row) : null
}
