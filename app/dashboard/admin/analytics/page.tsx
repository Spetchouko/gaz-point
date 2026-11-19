"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, AlertCircle, ArrowLeft, BarChart3, TrendingUp, Users, Package, Clock, PieChart, Activity, Maximize, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { AdminPageHeader, AdminCard, AdminStatCard, AdminBadge } from "@/app/_components/dashboard/admin";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface AnalyticsData {
  period: { from: string; to: string };
  generatedAt: string;
  kpis: {
    acquisition: {
      uniqueVisitors: number;
      totalSessions: number;
      newVisitors: number;
      returningVisitors: number;
    };
    conversion: {
      signupsCompleted: number;
      sellerSignups: number;
      emailVerified: number;
      conversionVisitToSignup: number;
      conversionVisitToClient: number;
      conversionVisitToSeller: number;
    };
    users: {
      totalUsers: number;
      totalClients: number;
      totalVendors: number;
      totalAdmins: number;
      verifiedUsers: number;
      unverifiedUsers: number;
      activeUsers: number;
      newUsersPeriod: number;
      newVendorsPeriod: number;
    };
    business: {
      totalPoints: number;
      activePoints: number;
      totalDispos: number;
      activeDispos: number;
      searchesCount: number;
      searchResultsViewed: number;
      pointsCreatedPeriod: number;
      disposPublishedPeriod: number;
      activeSellers: number;
    };
  };
  charts: {
    traffic: Array<{
      date: string;
      uniqueVisitors: number;
      sessions: number;
      newVisitors: number;
      returningVisitors: number;
    }>;
    funnel: Array<{
      step: string;
      label: string;
      volume: number;
      rate: number;
    }>;
    evolution: Array<{
      date: string;
      clients: number;
      vendors: number;
      verified: number;
    }>;
    topPages: Array<{ name: string; views: number; uniqueVisitors: number; avgTime: number }>;
    sources: Array<{ name: string; count: number }>;
    devices: Array<{ name: string; count: number }>;
    search: {
      totalSearches: number;
      resultsViewed: number;
      topBrands: Array<{ name: string; count: number }>;
      topFormats: Array<{ name: string; count: number }>;
      searchesWithoutResults: number;
    };
    sellers: {
      pointsCreatedPeriod: number;
      disposPublishedPeriod: number;
      activeSellers: number;
      evolution: Array<{
        date: string;
        points: number;
        dispos: number;
      }>;
    };
  };
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<string>("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics?period=${period}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Impossible de charger les analytics");
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAnalytics();
    return () => { cancelled = true; };
  }, [period]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  const k = data.kpis;

  return (
    <div className="admin-section">
      <AdminPageHeader
        title="Rapports et statistiques"
        subtitle="Analyse de l'activité de la plateforme GazPoints"
        icon={<BarChart3 className="size-5" />}
        actions={
          <>
            <Select value={period} onValueChange={(value) => setPeriod(value ?? "30")}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={period + " jours"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 jour</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/dashboard/admin">
              <Button variant="outline">
                <ArrowLeft className="size-4 mr-2" /> Retour
              </Button>
            </Link>
          </>
        }
      />

      {error && (
        <AdminCard className="border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </AdminCard>
      )}

      {/* KPI Row */}
      <div className="admin-grid admin-grid--4">
        <AdminStatCard
          title="Visiteurs uniques"
          value={k.acquisition.uniqueVisitors}
          icon={<Activity className="size-5" />}
          iconColor="blue"
          label={`${k.acquisition.newVisitors} nouveaux • ${k.acquisition.returningVisitors} récurrents`}
        />
        <AdminStatCard
          title="Inscriptions"
          value={k.conversion.signupsCompleted}
          icon={<Users className="size-5" />}
          iconColor="green"
          label={`${k.conversion.emailVerified} emails vérifiés`}
        />
        <AdminStatCard
          title="Points de vente"
          value={k.business.totalPoints}
          icon={<Store className="size-5" />}
          iconColor="orange"
          label={`${k.business.activePoints} actifs`}
        />
        <AdminStatCard
          title="Taux de conversion"
          value={k.conversion.conversionVisitToSignup.toFixed(1) + "%"}
          icon={<TrendingUp className="size-5" />}
          iconColor="purple"
          label="Visiteur → Inscription"
        />
      </div>

      {/* Charts Row 1: Traffic + Funnel */}
      <div className="admin-grid admin-grid--2">
        <AdminCard title="Évolution du trafic" description="Visiteurs uniques et sessions par jour" icon={<Activity className="size-5" />} className="lg:col-span-2">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.charts.traffic}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="uniqueVisitors" stroke="#3b82f6" strokeWidth={2} name="Visiteurs uniques" />
                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} name="Sessions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard title="Entonnoir de conversion" description="Parcours du visiteur à l'inscription vérifiée" icon={<Package className="size-5" />}>
          <div className="space-y-3">
            {data.charts.funnel.map((step, i) => (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-8 text-right text-xs font-medium text-muted-foreground">
                  {step.volume.toLocaleString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{step.label}</span>
                    <AdminBadge variant="info" className="text-xs">
                      {step.rate.toFixed(0)}%
                    </AdminBadge>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full w-full mt-1">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${Math.min(step.rate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Charts Row 2: Evolution + Sources/Devices */}
      <div className="admin-grid admin-grid--2">
        <AdminCard title="Nouveaux inscrits par jour" description="Clients et vendeurs inscrits quotidiennement" icon={<Users className="size-5" />}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.charts.evolution}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clients" stroke="#3b82f6" strokeWidth={2} name="Clients" />
                <Line type="monotone" dataKey="vendors" stroke="#10b981" strokeWidth={2} name="Vendeurs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard title="Sources de trafic" description="Répartition de l'origine des visiteurs" icon={<PieChart className="size-5" />}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={data.charts.sources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label
                >
                  {data.charts.sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      {/* Charts Row 3: Devices + Top Brands */}
      <div className="admin-grid admin-grid--2">
        <AdminCard title="Appareils utilisés" description="Répartition mobile / ordinateur / tablette" icon={<PieChart className="size-5" />}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={data.charts.devices}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label
                >
                  {data.charts.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard title="Marques et formats recherchés" description="Tendances de recherche des utilisateurs" icon={<Search className="size-5" />} className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Marques populaires
              </h3>
              {data.charts.search.topBrands.slice(0, 6).map((b) => (
                <div key={b.name} className="flex items-center justify-between py-2 text-sm border-b border-border/50">
                  <span className="text-muted-foreground">{b.name}</span>
                  <span className="font-medium">{b.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Formats populaires
              </h3>
              {data.charts.search.topFormats.slice(0, 6).map((f) => (
                <div key={f.name} className="flex items-center justify-between py-2 text-sm border-b border-border/50">
                  <span className="text-muted-foreground">{f.name}</span>
                  <span className="font-medium">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Résumé business */}
      <AdminCard title="Activité commerciale" icon={<Package className="size-5" />}>
        <div className="admin-grid admin-grid--4">
          <div>
            <p className="admin-stat-card__label">Recherches</p>
            <p className="admin-stat-card__value">{k.business.searchesCount.toLocaleString()}</p>
          </div>
          <div>
            <p className="admin-stat-card__label">Points créés</p>
            <p className="admin-stat-card__value">{k.business.pointsCreatedPeriod.toLocaleString()}</p>
          </div>
          <div>
            <p className="admin-stat-card__label">Disponibilités publiées</p>
            <p className="admin-stat-card__value">{k.business.disposPublishedPeriod.toLocaleString()}</p>
          </div>
          <div>
            <p className="admin-stat-card__label">Vendeurs actifs</p>
            <p className="admin-stat-card__value">{k.business.activeSellers.toLocaleString()}</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}