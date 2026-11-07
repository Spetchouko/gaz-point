import { and, count, eq, gte, lte } from "drizzle-orm"
import { db } from "@/db"
import { publicite, publiciteEvent } from "@/db/schema"
import {
  buildDayBuckets,
  computeRates,
  CONVERSION_LABELS,
  CONVERSION_TYPES,
  dayKey,
  SOURCE_CATEGORIES,
  SOURCE_LABELS,
  type AnalyticsRange,
  type PubliciteAdStats,
  type PubliciteConversionStat,
  type PubliciteSeriesPoint,
  type PubliciteSourceStat,
  type PubliciteStats,
} from "@/lib/publicite-analytics"

/**
 * Agrégation des performances publicitaires, entièrement côté serveur.
 *
 * Aucune statistique n'est inventée : toutes les valeurs proviennent de la table
 * `publicite_event`. Une publicité sans événement apparaît à zéro.
 */
export async function getPubliciteStats(range: AnalyticsRange): Promise<PubliciteStats> {
  const inRange = and(
    gte(publiciteEvent.createdAt, range.from),
    lte(publiciteEvent.createdAt, range.to)
  )

  const [typeCounts, perAdRows, sourceRows, dailyRows, conversionRows, ads] =
    await Promise.all([
      db
        .select({ eventType: publiciteEvent.eventType, total: count() })
        .from(publiciteEvent)
        .where(inRange)
        .groupBy(publiciteEvent.eventType),
      db
        .select({
          publiciteId: publiciteEvent.publiciteId,
          eventType: publiciteEvent.eventType,
          total: count(),
        })
        .from(publiciteEvent)
        .where(inRange)
        .groupBy(publiciteEvent.publiciteId, publiciteEvent.eventType),
      db
        .select({
          sourceCategory: publiciteEvent.sourceCategory,
          eventType: publiciteEvent.eventType,
          total: count(),
        })
        .from(publiciteEvent)
        .where(inRange)
        .groupBy(publiciteEvent.sourceCategory, publiciteEvent.eventType),
      db
        .select({ createdAt: publiciteEvent.createdAt, eventType: publiciteEvent.eventType })
        .from(publiciteEvent)
        .where(inRange),
      db
        .select({ conversionType: publiciteEvent.conversionType, total: count() })
        .from(publiciteEvent)
        .where(and(inRange, eq(publiciteEvent.eventType, "conversion")))
        .groupBy(publiciteEvent.conversionType),
      db
        .select({
          id: publicite.id,
          title: publicite.title,
          slot: publicite.slot,
          status: publicite.status,
        })
        .from(publicite),
    ])

  const totals = { impressions: 0, clicks: 0, conversions: 0 }
  for (const row of typeCounts) {
    const value = Number(row.total)
    if (row.eventType === "impression") totals.impressions = value
    else if (row.eventType === "click") totals.clicks = value
    else if (row.eventType === "conversion") totals.conversions = value
  }

  const buckets = buildDayBuckets(range.from, range.to)
  const seriesMap = new Map<string, PubliciteSeriesPoint>(
    buckets.map((bucket) => [
      bucket.date,
      { ...bucket, impressions: 0, clicks: 0, conversions: 0 },
    ])
  )
  for (const row of dailyRows) {
    const bucket = seriesMap.get(dayKey(new Date(row.createdAt)))
    if (!bucket) continue
    if (row.eventType === "impression") bucket.impressions += 1
    else if (row.eventType === "click") bucket.clicks += 1
    else if (row.eventType === "conversion") bucket.conversions += 1
  }

  const perAdMap = new Map<string, { impressions: number; clicks: number; conversions: number }>()
  for (const row of perAdRows) {
    const entry =
      perAdMap.get(row.publiciteId) ?? { impressions: 0, clicks: 0, conversions: 0 }
    const value = Number(row.total)
    if (row.eventType === "impression") entry.impressions = value
    else if (row.eventType === "click") entry.clicks = value
    else if (row.eventType === "conversion") entry.conversions = value
    perAdMap.set(row.publiciteId, entry)
  }
  const byAd: PubliciteAdStats[] = ads
    .map((ad) => {
      const entry = perAdMap.get(ad.id) ?? { impressions: 0, clicks: 0, conversions: 0 }
      const rates = computeRates(entry.impressions, entry.clicks, entry.conversions)
      return {
        id: ad.id,
        title: ad.title,
        slot: ad.slot,
        status: ad.status,
        impressions: entry.impressions,
        clicks: entry.clicks,
        conversions: entry.conversions,
        ctr: rates.ctr,
        conversionRate: rates.conversionRate,
      }
    })
    .sort((a, b) => b.impressions - a.impressions)

  // Sources des visiteurs ayant interagi (clics). Les conversions ne portent pas
  // la source du clic : on ne présente donc que les clics par source.
  const sourceClicks = new Map<string, number>()
  for (const row of sourceRows) {
    if (row.eventType !== "click") continue
    const key = row.sourceCategory ?? "direct"
    sourceClicks.set(key, (sourceClicks.get(key) ?? 0) + Number(row.total))
  }
  const bySource: PubliciteSourceStat[] = SOURCE_CATEGORIES.map((source) => ({
    source,
    label: SOURCE_LABELS[source],
    clicks: sourceClicks.get(source) ?? 0,
  }))

  const conversionMap = new Map<string, number>()
  for (const row of conversionRows) {
    conversionMap.set(row.conversionType ?? "signup", Number(row.total))
  }
  const byConversion: PubliciteConversionStat[] = CONVERSION_TYPES.map((type) => ({
    type,
    label: CONVERSION_LABELS[type],
    count: conversionMap.get(type) ?? 0,
  }))

  const rates = computeRates(totals.impressions, totals.clicks, totals.conversions)

  return {
    totals: { ...totals, ...rates },
    series: Array.from(seriesMap.values()),
    byAd,
    bySource,
    byConversion,
  }
}
