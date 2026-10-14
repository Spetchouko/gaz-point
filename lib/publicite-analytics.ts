/**
 * Helpers partagés (serveur + client) des statistiques publicitaires.
 *
 * Ce module est volontairement sans dépendance serveur : les formules de taux,
 * la classification des sources de trafic, la fenêtre d'attribution et le calcul
 * des périodes y sont définis une seule fois pour éviter toute divergence entre
 * la collecte, l'agrégation et l'affichage.
 */

/* ------------------------------ Types d'événements ------------------------------ */

export const AD_EVENT_TYPES = ["impression", "click", "conversion"] as const
export type AdEventType = (typeof AD_EVENT_TYPES)[number]

export function isAdEventType(value: unknown): value is AdEventType {
  return typeof value === "string" && (AD_EVENT_TYPES as readonly string[]).includes(value)
}

export const CONVERSION_TYPES = ["signup", "search", "reservation"] as const
export type ConversionType = (typeof CONVERSION_TYPES)[number]

export function isConversionType(value: unknown): value is ConversionType {
  return typeof value === "string" && (CONVERSION_TYPES as readonly string[]).includes(value)
}

export const CONVERSION_LABELS: Record<ConversionType, string> = {
  signup: "Inscription",
  search: "Recherche de gaz",
  reservation: "Réservation",
}

/* --------------------------------- Sources --------------------------------- */

export const SOURCE_CATEGORIES = [
  "direct",
  "search",
  "social",
  "referral",
  "campaign",
] as const
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number]

export function isSourceCategory(value: unknown): value is SourceCategory {
  return typeof value === "string" && (SOURCE_CATEGORIES as readonly string[]).includes(value)
}

export const SOURCE_LABELS: Record<SourceCategory, string> = {
  direct: "Accès direct",
  search: "Moteurs de recherche",
  social: "Réseaux sociaux",
  referral: "Sites référents",
  campaign: "Campagnes publicitaires",
}

const SEARCH_HOSTS = [
  "google.",
  "bing.",
  "yahoo.",
  "duckduckgo.",
  "qwant.",
  "ecosia.",
  "yandex.",
  "baidu.",
  "startpage.",
  "search.brave.",
]

const SOCIAL_HOSTS = [
  "facebook.",
  "fb.",
  "instagram.",
  "twitter.",
  "x.com",
  "t.co",
  "linkedin.",
  "youtube.",
  "youtu.be",
  "tiktok.",
  "snapchat.",
  "whatsapp.",
  "wa.me",
  "telegram.",
  "t.me",
  "pinterest.",
  "reddit.",
  "threads.",
]

const CAMPAIGN_MEDIUMS = [
  "cpc",
  "ppc",
  "paid",
  "paidsearch",
  "display",
  "banner",
  "cpm",
  "ads",
  "ad",
  "sponsored",
  "email",
]

/** Hôte (hostname) d'une URL de référence, ou null. Aucun chemin n'est conservé. */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    return url.hostname.toLowerCase() || null
  } catch {
    return null
  }
}

function matchesHost(host: string, patterns: string[]): boolean {
  return patterns.some((pattern) => host.includes(pattern))
}

/**
 * Classe la source d'origine d'un visiteur.
 * Une campagne (paramètres UTM) prime sur le referrer.
 */
export function classifySource(input: {
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
}): SourceCategory {
  const medium = (input.utmMedium ?? "").toLowerCase().trim()
  const source = (input.utmSource ?? "").toLowerCase().trim()
  const campaign = (input.utmCampaign ?? "").toLowerCase().trim()

  if (source || campaign || CAMPAIGN_MEDIUMS.includes(medium)) return "campaign"

  const host = referrerHost(input.referrer)
  if (!host) return "direct"
  if (matchesHost(host, SEARCH_HOSTS)) return "search"
  if (matchesHost(host, SOCIAL_HOSTS)) return "social"
  return "referral"
}

/* ---------------------------------- Taux ---------------------------------- */

/** Fenêtre d'attribution (dernier clic) : 30 jours. */
export const ATTRIBUTION_WINDOW_DAYS = 30

/** Règle de visibilité d'une impression : au moins 50 % visible pendant 1 s. */
export const IMPRESSION_VISIBLE_RATIO = 0.5
export const IMPRESSION_MIN_VISIBLE_MS = 1000

export function safeRate(numerator: number, denominator: number): number {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return 0
  }
  return (numerator / denominator) * 100
}

/** CTR = clics / impressions ; taux de conversion = conversions / clics. */
export function computeRates(impressions: number, clicks: number, conversions: number) {
  return {
    ctr: safeRate(clicks, impressions),
    conversionRate: safeRate(conversions, clicks),
  }
}

export function formatPercent(value: number, digits = 1): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${safe.toFixed(digits).replace(".", ",")} %`
}

/* --------------------------------- Périodes --------------------------------- */

export const ANALYTICS_PERIOD_KEYS = ["7", "30", "custom"] as const
export type AnalyticsPeriodKey = (typeof ANALYTICS_PERIOD_KEYS)[number]

export type AnalyticsRange = {
  key: AnalyticsPeriodKey
  from: Date
  to: Date
  days: number
  fromInput: string
  toInput: string
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toDateInputValue(date: Date): string {
  return dayKey(date)
}

export function parseDateInput(value?: string | null): Date | null {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return null
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }
  return parsed
}

function daysBetweenInclusive(from: Date, to: Date): number {
  return Math.max(
    1,
    Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000) + 1
  )
}

/**
 * Résout la période d'analyse (7 j, 30 j ou dates personnalisées).
 * Toute entrée invalide retombe sur 30 jours pour ne jamais casser l'affichage.
 */
export function resolveAnalyticsRange(
  period?: string | null,
  fromInput?: string | null,
  toInput?: string | null,
  now: Date = new Date()
): AnalyticsRange {
  if (period === "custom") {
    const from = parseDateInput(fromInput)
    const to = parseDateInput(toInput)
    if (from && to) {
      const rangeFrom = startOfDay(from)
      const rangeTo = endOfDay(to)
      if (rangeFrom.getTime() <= rangeTo.getTime()) {
        return {
          key: "custom",
          from: rangeFrom,
          to: rangeTo,
          days: daysBetweenInclusive(rangeFrom, rangeTo),
          fromInput: toDateInputValue(rangeFrom),
          toInput: toDateInputValue(rangeTo),
        }
      }
    }
  }

  const key: AnalyticsPeriodKey = period === "7" ? "7" : "30"
  const days = key === "7" ? 7 : 30
  const from = startOfDay(new Date(now.getTime() - (days - 1) * 86_400_000))
  return {
    key,
    from,
    to: now,
    days,
    fromInput: toDateInputValue(from),
    toInput: toDateInputValue(now),
  }
}

/** Un point de série par jour, borné à 400 jours pour éviter tout abus. */
export function buildDayBuckets(from: Date, to: Date): { date: string; label: string }[] {
  const buckets: { date: string; label: string }[] = []
  const cursor = startOfDay(from)
  const last = startOfDay(to)
  let guard = 0
  while (cursor.getTime() <= last.getTime() && guard < 400) {
    buckets.push({
      date: dayKey(cursor),
      label: cursor.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    })
    cursor.setDate(cursor.getDate() + 1)
    guard += 1
  }
  if (buckets.length === 0) {
    buckets.push({
      date: dayKey(from),
      label: from.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    })
  }
  return buckets
}

/* ------------------------------ Types d'agrégats ------------------------------ */

export type PubliciteKpis = {
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  conversionRate: number
}

export type PubliciteAdStats = PubliciteKpis & {
  id: string
  title: string
  slot: string
  status: string
}

export type PubliciteSourceStat = {
  source: SourceCategory
  label: string
  clicks: number
}

export type PubliciteConversionStat = {
  type: ConversionType
  label: string
  count: number
}

export type PubliciteSeriesPoint = {
  date: string
  label: string
  impressions: number
  clicks: number
  conversions: number
}

export type PubliciteStats = {
  totals: PubliciteKpis
  series: PubliciteSeriesPoint[]
  byAd: PubliciteAdStats[]
  bySource: PubliciteSourceStat[]
  byConversion: PubliciteConversionStat[]
}
