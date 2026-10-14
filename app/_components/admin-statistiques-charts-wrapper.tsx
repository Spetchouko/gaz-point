"use client"

import dynamic from "next/dynamic"

const AdminTrafficCharts = dynamic(() => import("@/app/_components/admin-traffic-charts").then((mod) => mod.AdminTrafficCharts), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const DevicePieChart = dynamic(() => import("@/app/_components/admin-statistiques-charts").then((mod) => mod.DevicePieChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const SourceBarChart = dynamic(() => import("@/app/_components/admin-statistiques-charts").then((mod) => mod.SourceBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const TrafficComposedChart = dynamic(() => import("@/app/_components/admin-statistiques-charts").then((mod) => mod.TrafficComposedChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const PageBarChart = dynamic(() => import("@/app/_components/admin-statistiques-charts").then((mod) => mod.PageBarChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

const EvolutionChart = dynamic(() => import("@/app/_components/admin-statistiques-charts").then((mod) => mod.EvolutionChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted/50 rounded-lg" />,
})

type TrafficData = { date: string; visits: number; signups: number; signins: number }
type EvolutionData = { date: string; users: number; vendors: number }
type PageData = { name: string; count: number }

export function AdminStatistiquesChartsWrapper({
  trafficData,
  evolutionSeries,
  mobileCount,
  desktopCount,
  tabletCount,
  directTraffic,
  searchTraffic,
  socialTraffic,
  referralTraffic,
  campaignTraffic,
  mostVisitedPages,
}: {
  trafficData: TrafficData[]
  evolutionSeries: EvolutionData[]
  mobileCount: number
  desktopCount: number
  tabletCount: number
  directTraffic: number
  searchTraffic: number
  socialTraffic: number
  referralTraffic: number
  campaignTraffic: number
  mostVisitedPages: PageData[]
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

      <section aria-labelledby="traffic-heading">
        <h2 id="traffic-heading" className="text-xl font-semibold mb-4">
          Trafic détaillé
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <TrafficComposedChart data={trafficData} />
          <PageBarChart data={mostVisitedPages} />
        </div>
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