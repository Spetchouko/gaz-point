import "dotenv/config"
import { randomUUID } from "node:crypto"
import { eq, and, lte, gt, isNull, or } from "drizzle-orm"
import { db } from "@/db"
import { publicite } from "@/db/schema"
import {
  PUBLICITE_DURATION_MIN,
  PUBLICITE_DURATION_MAX,
  PUBLICITE_DURATION_DEFAULT,
  PUBLICITE_PRIORITY_MIN,
  PUBLICITE_PRIORITY_MAX,
  PUBLICITE_DISPLAY_ORDER_MIN,
  PUBLICITE_DISPLAY_ORDER_MAX,
  isPubliciteSlot,
  validatePubliciteDuration,
  validatePublicitePriority,
  validatePubliciteDisplayOrder,
} from "@/lib/publicite-config"
import {
  getCachedPublicitesForSlot,
  getCachedPublicitesForBothSlots,
  fetchPublicitesForBothSlots,
  invalidatePubliciteCache,
  PUBLICITE_CACHE_TAG,
  type PubliciteBannerData,
} from "@/lib/publicite"

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

const TEST_SLOTS = ["home_hero", "home_search"] as const
const NOW = new Date()

/**
 * Reproduit la logique de `getEligiblePublicites` du composant PubliciteCarousel.
 * Pubs éligibles : statut actif ET diffusion en cours (période [startAt, endAt]).
 */
function getEligiblePublicites(ads: PubliciteBannerData[]): PubliciteBannerData[] {
  const now = new Date()

  return ads.filter((ad) => {
    if (ad.status !== "active") return false

    const startMs = ad.startAt ? new Date(ad.startAt).getTime() : 0
    const endMs = ad.endAt ? new Date(ad.endAt).getTime() : Infinity

    return now.getTime() >= startMs && now.getTime() <= endMs
  })
}

async function cleanup() {
  try {
    // Supprimer toutes les pubs de test (titre commençant par ZZTEST_)
    await db.delete(publicite).where(eq(publicite.title, "ZZTEST_AD"))
    await db.delete(publicite).where(eq(publicite.title, "ZZTEST_AD_A"))
    await db.delete(publicite).where(eq(publicite.title, "ZZTEST_AD_B"))
    await db.delete(publicite).where(eq(publicite.title, "ZZTEST_AD_C"))
    await db.delete(publicite).where(eq(publicite.title, "ZZTEST_HERO"))
    await db.delete(publicite).where(eq(publicite.title, "ZZTEST_SEARCH"))
  } catch { /* ignore */ }
}

// Helper pour récupérer les pubs d'un slot via la requête groupée
async function fetchPublicitesForSlot(slot: string): Promise<PubliciteBannerData[]> {
  const both = await fetchPublicitesForBothSlots()
  return both[slot as "home_hero" | "home_search"] ?? []
}

async function insertTestAd(overrides: Partial<{
  title: string
  slot: string
  status: string
  startAt: Date | null
  endAt: Date | null
  duration: number | null
  priority: number
  displayOrder: number
}> = {}) {
  const id = `ZZTEST_AD_${randomUUID()}`
  await db.insert(publicite).values({
    id,
    title: overrides.title ?? "ZZTEST_AD",
    slot: overrides.slot ?? "home_hero",
    status: overrides.status ?? "active",
    startAt: overrides.startAt ?? null,
    endAt: overrides.endAt ?? null,
    duration: overrides.duration ?? null,
    priority: overrides.priority ?? 0,
    displayOrder: overrides.displayOrder ?? 0,
    createdAt: NOW,
    updatedAt: NOW,
  })
  return id
}

async function main() {
  console.log("\n=== Tests système publicitaire GazPoints ===")
  await cleanup()

  console.log("\n[1] Constantes de configuration")
  expectEq("PUBLICITE_DURATION_MIN = 5", PUBLICITE_DURATION_MIN, 5)
  expectEq("PUBLICITE_DURATION_MAX = 30", PUBLICITE_DURATION_MAX, 30)
  expectEq("PUBLICITE_DURATION_DEFAULT = 8", PUBLICITE_DURATION_DEFAULT, 8)
  expectEq("PUBLICITE_PRIORITY_MIN = 0", PUBLICITE_PRIORITY_MIN, 0)
  expectEq("PUBLICITE_PRIORITY_MAX = 100", PUBLICITE_PRIORITY_MAX, 100)
  expectEq("PUBLICITE_DISPLAY_ORDER_MIN = 0", PUBLICITE_DISPLAY_ORDER_MIN, 0)
  expectEq("PUBLICITE_DISPLAY_ORDER_MAX = 1000", PUBLICITE_DISPLAY_ORDER_MAX, 1000)

  console.log("\n[2] Validation durée")
  expectEq("null → ok", validatePubliciteDuration(null), null)
  expectEq("8 → ok", validatePubliciteDuration(8), null)
  expectEq("5 → ok (min)", validatePubliciteDuration(5), null)
  expectEq("30 → ok (max)", validatePubliciteDuration(30), null)
  check("4 → erreur (sous min)", validatePubliciteDuration(4) !== null)
  check("31 → erreur (sur max)", validatePubliciteDuration(31) !== null)
  check("3.5 → erreur (non entier)", validatePubliciteDuration(3.5) !== null)

  console.log("\n[3] Validation priorité")
  expectEq("null → ok", validatePublicitePriority(null), null)
  expectEq("0 → ok (min)", validatePublicitePriority(0), null)
  expectEq("50 → ok", validatePublicitePriority(50), null)
  expectEq("100 → ok (max)", validatePublicitePriority(100), null)
  check("-1 → erreur", validatePublicitePriority(-1) !== null)
  check("101 → erreur", validatePublicitePriority(101) !== null)
  check("1.5 → erreur (non entier)", validatePublicitePriority(1.5) !== null)

  console.log("\n[4] Validation ordre d'affichage")
  expectEq("null → ok", validatePubliciteDisplayOrder(null), null)
  expectEq("0 → ok (min)", validatePubliciteDisplayOrder(0), null)
  expectEq("500 → ok", validatePubliciteDisplayOrder(500), null)
  expectEq("1000 → ok (max)", validatePubliciteDisplayOrder(1000), null)
  check("-1 → erreur", validatePubliciteDisplayOrder(-1) !== null)
  check("1001 → erreur", validatePubliciteDisplayOrder(1001) !== null)

  console.log("\n[5] Slot valide")
  check("home_hero valide", isPubliciteSlot("home_hero"))
  check("home_search valide", isPubliciteSlot("home_search"))
  check("apropos invalide", !isPubliciteSlot("apropos"))
  check("autre invalide", !isPubliciteSlot("autre"))

  console.log("\n[6] getEligiblePublicites — 1 pub active sans dates")
  await cleanup()
  const id1 = await insertTestAd({ status: "active", startAt: null, endAt: null })
  const ads1 = await fetchPublicitesForSlot("home_hero")
  const eligible1 = getEligiblePublicites(ads1)
  expectEq("1 pub éligible", eligible1.length, 1)
  expectEq("id correct", eligible1[0].id, id1)
  await cleanup()

  console.log("\n[7] getEligiblePublicites — 3 pubs, ordre displayOrder + priority")
  await cleanup()
  await insertTestAd({ title: "ZZTEST_AD_A", status: "active", displayOrder: 10, priority: 0 })
  await insertTestAd({ title: "ZZTEST_AD_B", status: "active", displayOrder: 5, priority: 0 })
  await insertTestAd({ title: "ZZTEST_AD_C", status: "active", displayOrder: 5, priority: 10 })
  const ads2 = await fetchPublicitesForSlot("home_hero")
  const eligible2 = getEligiblePublicites(ads2)
  expectEq("3 pubs éligibles", eligible2.length, 3)
  expectEq("1er = C (order 5, priority 10)", eligible2[0].title, "ZZTEST_AD_C")
  expectEq("2e = B (order 5, priority 0)", eligible2[1].title, "ZZTEST_AD_B")
  expectEq("3e = A (order 10)", eligible2[2].title, "ZZTEST_AD_A")
  await cleanup()

  console.log("\n[8] Rotation — durée par pub (champ duration)")
  await cleanup()
  const idDur = await insertTestAd({ status: "active", duration: 15000 })
  const adsDur = await fetchPublicitesForSlot("home_hero")
  const eligibleDur = getEligiblePublicites(adsDur)
  expectEq("duration = 15000ms", eligibleDur[0].duration, 15000)
  await cleanup()

  console.log("\n[9] Dates — startAt future = scheduled (non éligible)")
  await cleanup()
  await insertTestAd({ status: "scheduled", startAt: new Date(NOW.getTime() + 86400000) })
  const adsFuture = await fetchPublicitesForSlot("home_hero")
  const eligibleFuture = getEligiblePublicites(adsFuture)
  expectEq("pub future non éligible", eligibleFuture.length, 0)
  await cleanup()

  console.log("\n[10] Dates — endAt passé = expirée (non éligible)")
  await cleanup()
  await insertTestAd({ status: "active", endAt: new Date(NOW.getTime() - 86400000) })
  const adsPast = await fetchPublicitesForSlot("home_hero")
  const eligiblePast = getEligiblePublicites(adsPast)
  expectEq("pub expirée non éligible", eligiblePast.length, 0)
  await cleanup()

  console.log("\n[11] Suspended — jamais éligible")
  await cleanup()
  await insertTestAd({ status: "suspended" })
  const adsSusp = await fetchPublicitesForSlot("home_hero")
  const eligibleSusp = getEligiblePublicites(adsSusp)
  expectEq("pub suspendue non éligible", eligibleSusp.length, 0)
  await cleanup()

  console.log("\n[12] Deux emplacements — requête groupée (non cachée pour test)")
  await cleanup()
  await insertTestAd({ title: "ZZTEST_HERO", slot: "home_hero", status: "active" })
  await insertTestAd({ title: "ZZTEST_SEARCH", slot: "home_search", status: "active" })
  const both = await fetchPublicitesForBothSlots()
  check("home_hero a 1 pub", both.home_hero.length >= 1)
  check("home_search a 1 pub", both.home_search.length >= 1)
  await cleanup()

  console.log("\n[13] Invalidation cache — fonction disponible")
  check("invalidatePubliciteCache est une fonction", typeof invalidatePubliciteCache === "function")
  // Note: le test réel d'invalidation nécessite un contexte Next.js (Server Action / Route Handler)
  // et ne peut pas être exécuté dans un script tsx standalone. L'invalidation est testée
  // implicitement via les APIs POST/PATCH/DELETE/cron qui l'appellent.

  console.log(`\n=== RÉSULTAT: ${pass} PASS / ${failures.length} FAIL ===`)
  if (failures.length > 0) {
    console.log("Échecs:", failures.join(" | "))
    process.exit(1)
  }
}

main().catch(async (err) => {
  console.error("Erreur de test:", err)
  await cleanup()
  process.exit(1)
})