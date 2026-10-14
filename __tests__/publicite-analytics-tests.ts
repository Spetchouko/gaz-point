import "dotenv/config"
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { publicite, publiciteEvent } from "@/db/schema"
import {
  buildDayBuckets,
  classifySource,
  computeRates,
  parseDateInput,
  referrerHost,
  resolveAnalyticsRange,
  toDateInputValue,
  type PubliciteStats,
} from "@/lib/publicite-analytics"
import {
  isWithinAttributionWindow,
  parseAdAttribution,
  recordConversion,
  serializeAdAttribution,
} from "@/lib/publicite-attribution"
import { getPubliciteStats } from "@/lib/publicite-stats"

let pass = 0
const failures: string[] = []

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    pass += 1
    console.log(`  PASS ${name}`)
  } else {
    failures.push(name)
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` — ${String(detail)}`}`)
  }
}

function expectEq(name: string, actual: unknown, expected: unknown) {
  check(name, actual === expected, `got ${String(actual)} / want ${String(expected)}`)
}

function approx(name: string, actual: number, expected: number, tol = 0.01) {
  check(name, Math.abs(actual - expected) <= tol, `got ${actual} / want ~${expected}`)
}

const DAY = 86_400_000
const tempId = `ZZTEST_ADSTATS_${randomUUID()}`

async function main() {
  console.log("\n[1] Classification des sources")
  expectEq("sans referrer ni UTM → direct", classifySource({}), "direct")
  expectEq("referrer google → search", classifySource({ referrer: "https://www.google.com/search?q=gaz" }), "search")
  expectEq("referrer bing → search", classifySource({ referrer: "https://bing.com" }), "search")
  expectEq("referrer facebook → social", classifySource({ referrer: "https://facebook.com/post" }), "social")
  expectEq("referrer t.co → social", classifySource({ referrer: "https://t.co/abc" }), "social")
  expectEq("referrer blog → referral", classifySource({ referrer: "https://blog.example.com/article" }), "referral")
  expectEq("utm_source → campaign", classifySource({ utmSource: "newsletter" }), "campaign")
  expectEq("utm_medium=cpc → campaign", classifySource({ utmMedium: "cpc" }), "campaign")
  expectEq("utm_campaign → campaign", classifySource({ utmCampaign: "promo" }), "campaign")
  expectEq("campagne prime sur referrer", classifySource({ referrer: "https://google.com", utmSource: "fb" }), "campaign")
  expectEq("referrer invalide → direct", classifySource({ referrer: "pas une url" }), "direct")

  console.log("\n[2] referrerHost")
  expectEq("extrait l'hôte", referrerHost("https://news.example.com:8443/a/b"), "news.example.com")
  expectEq("null si vide", referrerHost(""), null)
  expectEq("null si invalide", referrerHost("::::"), null)

  console.log("\n[3] Taux (CTR / conversion)")
  const r1 = computeRates(100, 10, 2)
  approx("ctr 10/100 = 10", r1.ctr, 10)
  approx("conv 2/10 = 20", r1.conversionRate, 20)
  expectEq("ctr 0 si aucune impression", computeRates(0, 5, 1).ctr, 0)
  expectEq("taux conv 0 si aucun clic", computeRates(10, 0, 3).conversionRate, 0)
  expectEq("aucune division par zéro", computeRates(0, 0, 0).ctr, 0)

  console.log("\n[4] Périodes et filtres de dates")
  const now = new Date(2026, 9, 14, 12, 0, 0)
  const p7 = resolveAnalyticsRange("7", null, null, now)
  expectEq("période 7j → clé 7", p7.key, "7")
  expectEq("période 7j → 7 jours", p7.days, 7)
  const p30 = resolveAnalyticsRange("30", null, null, now)
  expectEq("période 30j → clé 30", p30.key, "30")
  expectEq("période par défaut → 30j", resolveAnalyticsRange(undefined, null, null, now).key, "30")
  expectEq("période inconnue → 30j", resolveAnalyticsRange("nawak", null, null, now).key, "30")
  const custom = resolveAnalyticsRange("custom", "2026-09-01", "2026-09-30", now)
  expectEq("custom → clé custom", custom.key, "custom")
  expectEq("custom inclusif → 30 jours", custom.days, 30)
  check("custom from <= to", custom.from.getTime() <= custom.to.getTime())
  expectEq("custom from>to → repli 30j", resolveAnalyticsRange("custom", "2026-09-30", "2026-09-01", now).key, "30")
  expectEq("custom date invalide → repli 30j", resolveAnalyticsRange("custom", "2026-13-40", "2026-02-02", now).key, "30")
  expectEq("buckets 7j = 7", buildDayBuckets(p7.from, p7.to).length, 7)
  expectEq("buckets 30j = 30", buildDayBuckets(p30.from, p30.to).length, 30)

  console.log("\n[5] parseDateInput strict")
  check("date valide", parseDateInput("2026-10-14") !== null)
  expectEq("jour inexistant rejeté", parseDateInput("2026-02-30"), null)
  expectEq("mois inexistant rejeté", parseDateInput("2026-13-01"), null)
  expectEq("format invalide rejeté", parseDateInput("14/10/2026"), null)

  console.log("\n[6] Attribution (sérialisation, fenêtre)")
  const att = { publiciteId: "ad-1", clickId: "click-1", clickedAt: 1_700_000_000_000 }
  const roundTrip = parseAdAttribution(serializeAdAttribution(att))
  check("aller-retour cookie", roundTrip !== null && roundTrip.publiciteId === "ad-1" && roundTrip.clickId === "click-1" && roundTrip.clickedAt === att.clickedAt)
  expectEq("cookie vide → null", parseAdAttribution(""), null)
  expectEq("cookie corrompu → null", parseAdAttribution("garbage.v2.x.y"), null)
  expectEq("cookie sans horodatage → null", parseAdAttribution("v1.ad.click"), null)
  const nowMs = Date.now()
  check("dans la fenêtre (maintenant)", isWithinAttributionWindow(nowMs, nowMs))
  check("dans la fenêtre (29 j)", isWithinAttributionWindow(nowMs - 29 * DAY, nowMs))
  check("hors fenêtre (31 j)", !isWithinAttributionWindow(nowMs - 31 * DAY, nowMs))
  check("horodatage futur rejeté", !isWithinAttributionWindow(nowMs + DAY, nowMs))

  console.log("\n[7] Base : préparation d'une publicité temporaire")
  await db.insert(publicite).values({ id: tempId, title: "ZZTEST_ADSTATS", slot: "home_hero", status: "active" })
  const adsCount = (await db.select({ id: publicite.id }).from(publicite)).length
  check("publicité temporaire créée", adsCount >= 1)

  console.log("\n[8] Conversions : garde-fous et idempotence")
  const noCookie = await recordConversion({ cookieValue: null, conversionType: "search" })
  expectEq("sans cookie → pas de conversion", noCookie, false)

  const oldCookie = serializeAdAttribution({ publiciteId: tempId, clickId: "old", clickedAt: Date.now() - 31 * DAY })
  expectEq("hors fenêtre 30j → refusée", await recordConversion({ cookieValue: oldCookie, conversionType: "search" }), false)

  const ghostCookie = serializeAdAttribution({ publiciteId: `ZZGHOST_${randomUUID()}`, clickId: "ghost", clickedAt: Date.now() })
  expectEq("publicité inexistante → refusée", await recordConversion({ cookieValue: ghostCookie, conversionType: "signup" }), false)

  const clickCookie = serializeAdAttribution({ publiciteId: tempId, clickId: "click-ok", clickedAt: Date.now() })
  expectEq("conversion recherche acceptée", await recordConversion({ cookieValue: clickCookie, conversionType: "search" }), true)
  expectEq("conversion recherche rejouée ignorée (idempotent)", await recordConversion({ cookieValue: clickCookie, conversionType: "search" }), true)
  const searchConvRows = await db
    .select({ id: publiciteEvent.id })
    .from(publiciteEvent)
    .where(eq(publiciteEvent.publiciteId, tempId))
  const searchConvCount = searchConvRows.length
  expectEq("une seule conversion recherche malgré 2 appels", searchConvCount, 1)
  await recordConversion({ cookieValue: clickCookie, conversionType: "signup" })
  await recordConversion({ cookieValue: clickCookie, conversionType: "reservation" })
  const afterTypes = (await db.select({ id: publiciteEvent.id }).from(publiciteEvent).where(eq(publiciteEvent.publiciteId, tempId))).length
  expectEq("chaque objectif compte une fois (3 conversions)", afterTypes, 3)

  console.log("\n[9] Déduplication des événements (eventKey)")
  const dupKey = `dup:${randomUUID()}`
  const insertDup = () =>
    db
      .insert(publiciteEvent)
      .values({
        id: randomUUID(),
        publiciteId: tempId,
        eventType: "impression",
        conversionType: null,
        slot: "home_hero",
        sourceCategory: "direct",
        referrerHost: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        path: "/",
        visitorId: "v1",
        sessionId: "s1",
        attributionWindowDays: null,
        consented: true,
        eventKey: dupKey,
      })
      .onConflictDoNothing({ target: publiciteEvent.eventKey })
  await insertDup()
  await insertDup()
  const dupRows = await db.select({ id: publiciteEvent.id }).from(publiciteEvent).where(eq(publiciteEvent.eventKey, dupKey))
  expectEq("même eventKey inséré 2x → 1 seule ligne", dupRows.length, 1)

  console.log("\n[10] Agrégation getPubliciteStats (données réelles)")
  // 2 impressions "search" + 1 impression "direct" aujourd'hui, 1 clic "search".
  const seed = [
    { eventType: "impression", sourceCategory: "search" },
    { eventType: "impression", sourceCategory: "search" },
    { eventType: "impression", sourceCategory: "direct" },
    { eventType: "click", sourceCategory: "search" },
  ]
  for (const ev of seed) {
    await db.insert(publiciteEvent).values({
      id: randomUUID(),
      publiciteId: tempId,
      eventType: ev.eventType,
      conversionType: null,
      slot: "home_hero",
      sourceCategory: ev.sourceCategory,
      referrerHost: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      path: "/",
      visitorId: "v1",
      sessionId: "s1",
      attributionWindowDays: ev.eventType === "click" ? 30 : null,
      consented: true,
      eventKey: `seed:${randomUUID()}`,
    })
  }
  // Un événement daté de 40 jours (doit être exclu des fenêtres 7/30 j).
  await db.insert(publiciteEvent).values({
    id: randomUUID(),
    publiciteId: tempId,
    eventType: "impression",
    conversionType: null,
    slot: "home_hero",
    sourceCategory: "direct",
    referrerHost: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    path: "/",
    visitorId: "v1",
    sessionId: "s1",
    attributionWindowDays: null,
    consented: true,
    eventKey: `backdated:${randomUUID()}`,
    createdAt: new Date(Date.now() - 40 * DAY),
  })

  const stats30: PubliciteStats = await getPubliciteStats(resolveAnalyticsRange("30"))
  const ad30 = stats30.byAd.find((a) => a.id === tempId)
  check("publicité présente dans byAd", ad30 !== undefined)
  expectEq("30j : impressions du jour = 4", ad30?.impressions, 4)
  expectEq("30j : clics = 1", ad30?.clicks, 1)
  expectEq("30j : conversions = 3", ad30?.conversions, 3)
  approx("30j : CTR = clics/impressions", ad30?.ctr ?? 0, (1 / 4) * 100)
  approx("30j : taux conv = conversions/clics", ad30?.conversionRate ?? 0, 300)
  const totalImpressions30 = stats30.totals.impressions
  check("totaux : impressions ≥ celles de la publicité temporaire", totalImpressions30 >= (ad30?.impressions ?? 0))
  const directClicks = stats30.bySource.find((s) => s.source === "direct")?.clicks ?? 0
  const searchClicks = stats30.bySource.find((s) => s.source === "search")?.clicks ?? 0
  expectEq("sources : clics search = 1", searchClicks, 1)
  expectEq("sources : clics direct = 0", directClicks, 0)
  expectEq("conversions par objectif : recherche = 1", stats30.byConversion.find((c) => c.type === "search")?.count, 1)
  expectEq("conversions par objectif : inscription = 1", stats30.byConversion.find((c) => c.type === "signup")?.count, 1)
  expectEq("conversions par objectif : réservation = 1", stats30.byConversion.find((c) => c.type === "reservation")?.count, 1)

  const stats7 = await getPubliciteStats(resolveAnalyticsRange("7"))
  const ad7 = stats7.byAd.find((a) => a.id === tempId)
  expectEq("7j : même total que 30j (aucune donnée ancienne)", ad7?.impressions, ad30?.impressions)

  const backdated = new Date(Date.now() - 45 * DAY)
  const customStats = await getPubliciteStats(
    resolveAnalyticsRange("custom", toDateInputValue(backdated), toDateInputValue(new Date()))
  )
  const adCustom = customStats.byAd.find((a) => a.id === tempId)
  expectEq("dates personnalisées : inclut l'événement de 40 j (+1 impression)", adCustom?.impressions, (ad30?.impressions ?? 0) + 1)

  console.log("\n[11] Nettoyage")
  await db.delete(publicite).where(eq(publicite.id, tempId))
  const leftover = await db.select({ id: publicite.id }).from(publicite).where(eq(publicite.id, tempId))
  expectEq("publicité temporaire supprimée", leftover.length, 0)
  const leftoverEvents = await db.select({ id: publiciteEvent.id }).from(publiciteEvent).where(eq(publiciteEvent.publiciteId, tempId))
  expectEq("événements supprimés en cascade", leftoverEvents.length, 0)

  console.log(`\nRÉSULTAT: ${pass} PASS / ${failures.length} FAIL`)
  if (failures.length > 0) {
    console.log("Échecs:", failures.join(" | "))
    process.exit(1)
  }
}

main().catch(async (error) => {
  console.error("Erreur de test:", error)
  try {
    await db.delete(publicite).where(eq(publicite.id, tempId))
  } catch {
    // ignore
  }
  process.exit(1)
})
