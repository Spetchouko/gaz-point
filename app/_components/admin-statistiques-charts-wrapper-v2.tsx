"use client"

import dynamic from "next/dynamic"

const AdminTrafficCharts = dynamic(() => import("@/app/_components/admin-traffic-charts").then((mod) => mod.AdminTrafficCharts), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const DevicePieChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.DevicePieChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const SourceBarChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.SourceBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const TrafficComposedChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.TrafficComposedChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const PageBarChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.PageBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const EvolutionChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.EvolutionChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const OSPieChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.OSPieChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const BrowserBarChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.BrowserBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const ResolutionBarChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.ResolutionBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const EntryExitChart = dynamic(() => import("@/app/_components/admin-statistiques-charts-v2").then((mod) => mod.EntryExitChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

type TrafficData = { date: string; visits: number; signups: number; signins: number }
type EvolutionData = { date: string; users: number; vendors: number }
type PageData = { name: string; count: number }
type OSData = { name: string; count: number; color: string }
type BrowserData = { name: string; count: number; color: string }
type ResolutionData = { name: string; count: number; color: string }
type EntryExitData = { name: string; entries: number; exits: number }

export function AdminStatistiquesChartsWrapperV2({
  trafficData,
  evolutionSeries,
  mobileCount,
  desktopCount,
  tabletCount,
  osData,
  browserData,
  resolutionData,
  directTraffic,
  searchTraffic,
  socialTraffic,
  referralTraffic,
  campaignTraffic,
  mostVisitedPages,
  entryExitPages,
}: {
  trafficData: TrafficData[]
  evolutionSeries: EvolutionData[]
  mobileCount: number
  desktopCount: number
  tabletCount: number
  osData: OSData[]
  browserData: BrowserData[]
  resolutionData: ResolutionData[]
  directTraffic: number
  searchTraffic: number
  socialTraffic: number
  referralTraffic: number
  campaignTraffic: number
  mostVisitedPages: PageData[]
  entryExitPages: EntryExitData[]
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="text-xl font-semibold mb-4">
          Graphiques interactifs
        </h2>
        <AdminTrafficCharts trafficData={trafficData} evolutionData={evolutionSeries} />
      </section>

      <section aria-labelledby="analysis-heading">
        <h2 id="analysis-heading" className="text-xl font-semibold mb-4">
          Analyse approfondie
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <DevicePieChart data={[
            { name: "Mobile", count: mobileCount, color: "hsl(142 70% 50%)" },
            { name: "Desktop", count: desktopCount, color: "hsl(217 91% 60%)" },
            { name: "Tablette", count: tabletCount, color: "hsl(268 82% 56%)" },
          ]} />
          
          <SourceBarChart data={[
            { name: "Accès direct", count: directTraffic },
            { name: "Moteurs de recherche", count: searchTraffic },
            { name: "Réseaux sociaux", count: socialTraffic },
            { name: "Sites référents", count: referralTraffic },
            { name: "Campagnes", count: campaignTraffic },
          ]} />
        </div>
      </section>

      <section aria-labelledby="tech-heading">
        <h2 id="tech-heading" className="text-xl font-semibold mb-4">
          Technologie & appareils
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <OSPieChart data={osData} />
          <BrowserBarChart data={browserData} />
          <ResolutionBarChart data={resolutionData} />
        </div>
      </section>

      <section aria-labelledby="traffic-heading">
        <h2 id="traffic-heading" className="text-xl font-semibold mb-4">
          Trafic détaillé
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <TrafficComposedChart data={trafficData} />
          <PageBarChart data={mostVisitedPages} />
        </div>
      </section>

      <section aria-labelledby="entryexit-heading">
        <h2 id="entryexit-heading" className="text-xl font-semibold mb-4">
          Pages d'entrée et de sortie
        </h2>
        <EntryExitChart data={entryExitPages} />
      </section>

      <section aria-labelledby="evolution-heading">
        <h2 id="evolution-heading" className="text-xl font-semibold mb-4">
          Évolution utilisateurs / vendeurs
        </h2>
        <EvolutionChart data={evolutionSeries} />
      </section>
    </div>
  )
}