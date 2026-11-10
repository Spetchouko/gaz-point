import { NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  trafficEvent,
  pointDeVente,
  disponibilite,
} from "@/db/schema"
import {
  count,
  eq,
  sql,
  and,
  gte,
  lt,
  desc,
} from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

/**
 * API d'agrégation analytics pour le dashboard administrateur.
 * Protégée : réservée aux administrateurs (requireAdmin).
 *
 * Toutes les calculations sont faites côté serveur via SQL.
 * Aucune donnée brute n'est envoyée au navigateur.
 */

function startOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
function endOfDayLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") ?? "30"
    const fromRaw = searchParams.get("from")
    const toRaw = searchParams.get("to")

    // Résolution de la période (réutilise la logique existante)
    const now = new Date()
    let rangeFrom: Date, rangeTo: Date

    if (period === "custom" && fromRaw && toRaw) {
      rangeFrom = startOfDayLocal(new Date(fromRaw))
      rangeTo = endOfDayLocal(new Date(toRaw))
    } else {
      const days = period === "today" ? 1 : period === "7" ? 7 : period === "90" ? 90 : 30
      rangeFrom = startOfDayLocal(new Date(now.getTime() - (days - 1) * 86_400_000))
      rangeTo = new Date(now.getTime() + 1000)
    }

    const wherePeriod = and(
      gte(trafficEvent.createdAt, rangeFrom),
      lt(trafficEvent.createdAt, rangeTo)
    )

    // ============================================================
    // KPI ACQUISITION
    // ============================================================

    // Visiteurs uniques = sessions distinctes (via sessionId ou userId pour les connectés)
    const uniqueVisitorsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT COALESCE(${trafficEvent.sessionId}, ${trafficEvent.userId}))`,
      })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "page_view")))
    const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count ?? 0)

    // Sessions = nombre de sessionId distincts
    const totalSessionsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${trafficEvent.sessionId})`,
      })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "page_view")))
    const totalSessions = Number(totalSessionsResult[0]?.count ?? 0)

    // Nouveaux visiteurs (page_view avec un userId nul ou session sans userId)
    // Approximation: visiteurs dont la première page_view dans la période n'a pas de userId
    const newVisitorsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${trafficEvent.sessionId})`,
      })
      .from(trafficEvent)
      .where(
        and(
          wherePeriod,
          eq(trafficEvent.eventType, "page_view"),
          sql`${trafficEvent.userId} IS NULL`
        )
      )
    const newVisitors = Number(newVisitorsResult[0]?.count ?? 0)

    // Visiteurs récurrents = uniques - nouveaux
    const returningVisitors = Math.max(0, uniqueVisitors - newVisitors)

    // ============================================================
    // KPI CONVERSION
    // ============================================================

    const signupsResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "signup_completed")))
    const signupsCompleted = Number(signupsResult[0]?.count ?? 0)

    const sellerSignupsResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "seller_signup_completed")))
    const sellerSignups = Number(sellerSignupsResult[0]?.count ?? 0)

    const emailVerifiedResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "email_verified")))
    const emailVerified = Number(emailVerifiedResult[0]?.count ?? 0)

    // Taux de conversion visiteur -> inscription
    const conversionVisitToSignup =
      uniqueVisitors > 0 ? (signupsCompleted / uniqueVisitors) * 100 : 0
    const conversionVisitToClient =
      uniqueVisitors > 0 ? ((signupsCompleted - sellerSignups) / uniqueVisitors) * 100 : 0
    const conversionVisitToSeller =
      uniqueVisitors > 0 ? (sellerSignups / uniqueVisitors) * 100 : 0

    // ============================================================
    // KPI UTILISATEURS
    // ============================================================

    const totalUsersResult = await db.select({ count: count() }).from(user)
    const totalClientsResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "client"))
    const totalVendorsResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "vendor"))
    const totalAdminsResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"))

    const verifiedUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.emailVerified, true))
    const unverifiedUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.emailVerified, false))

    const activeUsersResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.isActive, true))

    // Nouvelles inscriptions dans la période
    const newUsersPeriodResult = await db
      .select({ count: count() })
      .from(user)
      .where(and(gte(user.createdAt, rangeFrom), lt(user.createdAt, rangeTo)))

    const newVendorsPeriodResult = await db
      .select({ count: count() })
      .from(user)
      .where(
        and(
          eq(user.role, "vendor"),
          gte(user.createdAt, rangeFrom),
          lt(user.createdAt, rangeTo)
        )
      )

    // ============================================================
    // KPI ACTIVITÉ COMMERCIALE
    // ============================================================

    const totalPointsResult = await db.select({ count: count() }).from(pointDeVente)
    const activePointsResult = await db
      .select({ count: count() })
      .from(pointDeVente)
      .where(eq(pointDeVente.isActive, true))

    const totalDisposResult = await db
      .select({ count: count() })
      .from(disponibilite)
    const activeDisposResult = await db
      .select({ count: count() })
      .from(disponibilite)
      .where(eq(disponibilite.status, "disponible"))

    const searchesResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "search_performed")))
    const searchesCount = Number(searchesResult[0]?.count ?? 0)

    const searchResultsViewedResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "search_results_viewed")))
    const searchResultsViewed = Number(searchResultsViewedResult[0]?.count ?? 0)

    const pointsCreatedPeriodResult = await db
      .select({ count: count() })
      .from(pointDeVente)
      .where(and(gte(pointDeVente.createdAt, rangeFrom), lt(pointDeVente.createdAt, rangeTo)))

    const disposPublishedPeriodResult = await db
      .select({ count: count() })
      .from(disponibilite)
      .where(
        and(gte(disponibilite.createdAt, rangeFrom), lt(disponibilite.createdAt, rangeTo))
      )

    // ============================================================
    // TRAFIC PAR JOUR (graphique A)
    // ============================================================

    const trafficRows = await db
      .select({
        eventType: trafficEvent.eventType,
        createdAt: trafficEvent.createdAt,
        sessionId: trafficEvent.sessionId,
        userId: trafficEvent.userId,
      })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "page_view")))

    // Buckets par jour
    const dayBuckets: Record<string, { date: string; uniqueVisitors: number; sessions: number; newVisitors: number; returningVisitors: number }> = {}
    const daysDiff = Math.ceil((rangeTo.getTime() - rangeFrom.getTime()) / 86_400_000) + 1

    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(rangeFrom.getTime() + i * 86_400_000)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      dayBuckets[key] = { date: key, uniqueVisitors: 0, sessions: 0, newVisitors: 0, returningVisitors: 0 }
    }

    const sessionUsersByDay: Record<string, Set<string>> = {}
    const sessionHasUser: Record<string, boolean> = {}

    for (const row of trafficRows) {
      const d = new Date(row.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const bucket = dayBuckets[key]
      if (!bucket) continue
      const sid = row.sessionId
      if (sid) {
        if (!sessionUsersByDay[key]) sessionUsersByDay[key] = new Set()
        sessionUsersByDay[key].add(sid)
        if (row.userId) sessionHasUser[sid] = true
        else if (sessionHasUser[sid] === undefined) sessionHasUser[sid] = false
      }
    }

    // Calcul simplifié: uniqueVisitors = sessions distinctes par jour
    for (const [key, sessions] of Object.entries(sessionUsersByDay)) {
      if (dayBuckets[key]) {
        dayBuckets[key].sessions = sessions.size
        dayBuckets[key].uniqueVisitors = sessions.size
      }
    }

    const trafficData = Object.values(dayBuckets).sort((a, b) => a.date.localeCompare(b.date))

    // ============================================================
    // ENTONNOIR DE CONVERSION (graphique B)
    // ============================================================

    // Étape 1: Visiteurs (page_view uniques)
    const funnelVisitors = uniqueVisitors

    // Étape 2: Recherche de gaz (search_performed uniques)
    const searchUsersResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT COALESCE(${trafficEvent.sessionId}, ${trafficEvent.userId}))`,
      })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "search_performed")))
    const funnelSearch = Number(searchUsersResult[0]?.count ?? 0)

    // Étape 3: Début d'inscription (signup_started)
    const signupStartedResult = await db
      .select({ count: count() })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "signup_started")))
    const funnelSignupStarted = Number(signupStartedResult[0]?.count ?? 0)

    // Étape 4: Inscription terminée (signup_completed)
    const funnelSignupCompleted = signupsCompleted

    // Étape 5: Email vérifié
    const funnelEmailVerified = emailVerified

    const funnel = [
      { step: "Visiteurs", label: "Visiteurs", volume: funnelVisitors, rate: 100 },
      {
        step: "Recherche de gaz",
        label: "Recherche",
        volume: funnelSearch,
        rate: funnelVisitors > 0 ? (funnelSearch / funnelVisitors) * 100 : 0,
      },
      {
        step: "Début inscription",
        label: "Inscription débutée",
        volume: funnelSignupStarted,
        rate: funnelVisitors > 0 ? (funnelSignupStarted / funnelVisitors) * 100 : 0,
      },
      {
        step: "Inscription terminée",
        label: "Inscription terminée",
        volume: funnelSignupCompleted,
        rate: funnelVisitors > 0 ? (funnelSignupCompleted / funnelVisitors) * 100 : 0,
      },
      {
        step: "Compte vérifié",
        label: "Email vérifié",
        volume: funnelEmailVerified,
        rate: funnelVisitors > 0 ? (funnelEmailVerified / funnelVisitors) * 100 : 0,
      },
    ]

    // ============================================================
    // ÉVOLUTION DES INSCRIPTIONS (graphique C)
    // ============================================================

    const evolutionDays = Math.min(daysDiff, 30)
    const evolutionData = await Promise.all(
      Array.from({ length: evolutionDays }, async (_, i) => {
        const d = new Date(rangeFrom.getTime() + i * 86_400_000)
        const dayEnd = new Date(d.getTime() + 86_400_000)
        const [clients, vendors, verified] = await Promise.all([
          db
            .select({ count: count() })
            .from(user)
            .where(
              and(
                eq(user.role, "client"),
                gte(user.createdAt, d),
                lt(user.createdAt, dayEnd)
              )
            ),
          db
            .select({ count: count() })
            .from(user)
            .where(
              and(
                eq(user.role, "vendor"),
                gte(user.createdAt, d),
                lt(user.createdAt, dayEnd)
              )
            ),
          db
            .select({ count: count() })
            .from(user)
            .where(
              and(
                eq(user.emailVerified, true),
                gte(user.createdAt, d),
                lt(user.createdAt, dayEnd)
              )
            ),
        ])
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          clients: Number(clients[0]?.count ?? 0),
          vendors: Number(vendors[0]?.count ?? 0),
          verified: Number(verified[0]?.count ?? 0),
        }
      })
    )

    // ============================================================
    // PAGES LES PLUS VISITÉES (graphique D)
    // ============================================================

    const pageRows = await db
      .select({
        path: trafficEvent.path,
        views: count(),
        uniqueVisitors: sql<number>`COUNT(DISTINCT COALESCE(${trafficEvent.sessionId}, ${trafficEvent.userId}))`,
      })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "page_view")))
      .groupBy(trafficEvent.path)
      .orderBy(desc(sql`count()`))
      .limit(15)

    const topPages = pageRows.map((r) => ({
      name: r.path ?? "/",
      views: Number(r.views),
      uniqueVisitors: Number(r.uniqueVisitors),
      avgTime: 0, // pas mesuré de manière fiable
    }))

    // ============================================================
    // SOURCES DE TRAFIC (graphique E)
    // ============================================================

    const sourceRows = await db
      .select({
        referrer: trafficEvent.referrer,
        utmSource: trafficEvent.utmSource,
        utmMedium: trafficEvent.utmMedium,
        utmCampaign: trafficEvent.utmCampaign,
      })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "page_view")))

    const SEARCH_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo.", "qwant.", "ecosia.", "yandex.", "baidu."]
    const SOCIAL_HOSTS = ["facebook.", "fb.", "instagram.", "twitter.", "x.com", "t.co", "linkedin.", "youtube.", "tiktok.", "whatsapp.", "wa.me"]

    const sourceCounts = { direct: 0, search: 0, social: 0, other: 0 }

    for (const row of sourceRows) {
      let source = "direct"
      if (row.utmSource || row.utmCampaign) {
        source = "other" // campagne
      } else if (row.referrer) {
        try {
          const host = new URL(row.referrer).hostname.toLowerCase()
          if (SEARCH_HOSTS.some((h) => host.includes(h))) source = "search"
          else if (SOCIAL_HOSTS.some((h) => host.includes(h))) source = "social"
          else source = "other"
        } catch {
          source = "direct"
        }
      }
      sourceCounts[source as keyof typeof sourceCounts]++
    }

    // ============================================================
    // APPAREILS (graphique F) - approximation via userAgent
    // ============================================================

    const uaRows = await db
      .select({ userAgent: trafficEvent.userAgent, screenWidth: trafficEvent.screenWidth })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "page_view")))

    let mobile = 0, desktop = 0, tablet = 0
    for (const row of uaRows) {
      const ua = (row.userAgent ?? "").toLowerCase()
      const isMobile = /mobi|android|iphone|ipod|windows phone|iemobile|blackberry|opera mini/.test(ua)
      const isTablet = /ipad|tablet|android(?!.*mobile)/.test(ua) && !isMobile
      if (isMobile) mobile++
      else if (isTablet) tablet++
      else desktop++
    }

    // ============================================================
    // ACTIVITÉ DE RECHERCHE (graphique G)
    // ============================================================

    // Marques et formats les plus recherchés (depuis metadata)
    const searchMetaRows = await db
      .select({ metadata: trafficEvent.metadata, createdAt: trafficEvent.createdAt })
      .from(trafficEvent)
      .where(and(wherePeriod, eq(trafficEvent.eventType, "search_performed")))

    const brandCounts: Record<string, number> = {}
    const formatCounts: Record<string, number> = {}
    for (const row of searchMetaRows) {
      try {
        const meta = row.metadata as Record<string, string> | null
        if (meta?.brand) brandCounts[meta.brand] = (brandCounts[meta.brand] ?? 0) + 1
        if (meta?.format) formatCounts[meta.format] = (formatCounts[meta.format] ?? 0) + 1
      } catch {
        // ignore metadata invalide
      }
    }

    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    const topFormats = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    const searchesWithoutResults = 0 // non mesuré de manière fiable

    // ============================================================
    // ACTIVITÉ VENDEURS (graphique H)
    // ============================================================

    const activeSellersResult = await db
      .select({ count: count() })
      .from(user)
      .where(and(eq(user.role, "vendor"), eq(user.isActive, true)))

    const sellerEvolutionData = await Promise.all(
      Array.from({ length: Math.min(daysDiff, 30) }, async (_, i) => {
        const d = new Date(rangeFrom.getTime() + i * 86_400_000)
        const dayEnd = new Date(d.getTime() + 86_400_000)
        const [points, dispos] = await Promise.all([
          db
            .select({ count: count() })
            .from(pointDeVente)
            .where(and(gte(pointDeVente.createdAt, d), lt(pointDeVente.createdAt, dayEnd))),
          db
            .select({ count: count() })
            .from(disponibilite)
            .where(and(gte(disponibilite.createdAt, d), lt(disponibilite.createdAt, dayEnd))),
        ])
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
          points: Number(points[0]?.count ?? 0),
          dispos: Number(dispos[0]?.count ?? 0),
        }
      })
    )

    return NextResponse.json({
      period: { from: rangeFrom.toISOString(), to: rangeTo.toISOString() },
      generatedAt: new Date().toISOString(),
      kpis: {
        acquisition: {
          uniqueVisitors,
          totalSessions,
          newVisitors,
          returningVisitors,
        },
        conversion: {
          signupsCompleted,
          sellerSignups,
          emailVerified,
          conversionVisitToSignup: Math.round(conversionVisitToSignup * 100) / 100,
          conversionVisitToClient: Math.round(conversionVisitToClient * 100) / 100,
          conversionVisitToSeller: Math.round(conversionVisitToSeller * 100) / 100,
        },
        users: {
          totalUsers: Number(totalUsersResult[0]?.count ?? 0),
          totalClients: Number(totalClientsResult[0]?.count ?? 0),
          totalVendors: Number(totalVendorsResult[0]?.count ?? 0),
          totalAdmins: Number(totalAdminsResult[0]?.count ?? 0),
          verifiedUsers: Number(verifiedUsersResult[0]?.count ?? 0),
          unverifiedUsers: Number(unverifiedUsersResult[0]?.count ?? 0),
          activeUsers: Number(activeUsersResult[0]?.count ?? 0),
          newUsersPeriod: Number(newUsersPeriodResult[0]?.count ?? 0),
          newVendorsPeriod: Number(newVendorsPeriodResult[0]?.count ?? 0),
        },
        business: {
          totalPoints: Number(totalPointsResult[0]?.count ?? 0),
          activePoints: Number(activePointsResult[0]?.count ?? 0),
          totalDispos: Number(totalDisposResult[0]?.count ?? 0),
          activeDispos: Number(activeDisposResult[0]?.count ?? 0),
          searchesCount,
          searchResultsViewed,
          pointsCreatedPeriod: Number(pointsCreatedPeriodResult[0]?.count ?? 0),
          disposPublishedPeriod: Number(disposPublishedPeriodResult[0]?.count ?? 0),
          activeSellers: Number(activeSellersResult[0]?.count ?? 0),
        },
      },
      charts: {
        traffic: trafficData,
        funnel,
        evolution: evolutionData,
        topPages,
        sources: [
          { name: "Accès direct", count: sourceCounts.direct },
          { name: "Moteurs de recherche", count: sourceCounts.search },
          { name: "Réseaux sociaux", count: sourceCounts.social },
          { name: "Autres", count: sourceCounts.other },
        ],
        devices: [
          { name: "Mobile", count: mobile },
          { name: "Ordinateur", count: desktop },
          { name: "Tablette", count: tablet },
        ],
        search: {
          totalSearches: searchesCount,
          resultsViewed: searchResultsViewed,
          topBrands,
          topFormats,
          searchesWithoutResults,
        },
        sellers: {
          pointsCreatedPeriod: Number(pointsCreatedPeriodResult[0]?.count ?? 0),
          disposPublishedPeriod: Number(disposPublishedPeriodResult[0]?.count ?? 0),
          activeSellers: Number(activeSellersResult[0]?.count ?? 0),
          evolution: sellerEvolutionData,
        },
      },
    })
  } catch (error) {
    console.error("[analytics API] error", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
