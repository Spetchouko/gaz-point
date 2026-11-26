"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Clock,
  Calendar,
  CheckCircle2,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Archive,
  Shield,
  BarChart3,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { AdminPageHeader, AdminStatCard, AdminCard, AdminBadge } from "@/app/_components/dashboard/admin";

interface OverviewStats {
  users: {
    total: number;
    clients: number;
    vendors: number;
    admins: number;
    collaborateurs: number;
    active: number;
    newUsersPeriod: number;
    newVendorsPeriod: number;
    newCollaborateursPeriod: number;
  };
  points: {
    total: number;
    active: number;
    createdPeriod: number;
  };
  disponibilites: {
    total: number;
    active: number;
    publishedPeriod: number;
  };
  reservations: {
    total: number;
    pending: number;
    confirmed: number;
    collected: number;
    cancelled: number;
    month: number;
  };
  visitors: {
    unique: number;
  };
  revenue: {
    confirmed: number;
  };
  period: { from: string; to: string };
  charts: {
    reservationsByDay: Array<{ date: string; count: number }>;
    usersByDay: Array<{ date: string; count: number }>;
  };
}

/** Formatage français des dates */
const formatDateFr = (iso: string) => {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Détermine la tendance comparant deux valeurs */
const computeTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return { change: null, trend: null };
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change > 0) return { change, trend: "up" };
  if (change < 0) return { change, trend: "down" };
  return { change: 0, trend: "neutral" };
};

export default function AdminOverviewPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const res = await fetch(`/api/admin/overview?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Impossible de charger les statistiques");
        const data = await res.json();
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les statistiques");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, [from, to]);

  const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const defaultTo = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="text-muted-foreground mt-4">Chargement des statistiques...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-12 text-muted-foreground mb-4">
          <Activity className="size-12 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">{error || "Erreur inconnue"}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  const u = stats.users;
  const p = stats.points;
  const d = stats.disponibilites;
  const r = stats.reservations;
  const rev = stats.revenue;

  return (
    <div className="admin-section">
      {/* Page Header */}
      <AdminPageHeader
        title="Tableau de bord"
        subtitle="Statistiques et activité de la plateforme GazPoints"
        icon={<LayoutDashboard className="size-5" />}
        actions={
          <>
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
              <label className="sr-only">Date de début</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="admin-input admin-input--sm w-[150px]"
              />
              <label className="sr-only">Date de fin</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="admin-input admin-input--sm w-[150px]"
              />
              <Button
                onClick={() => { setFrom(defaultFrom); setTo(defaultTo); }}
                variant="outline"
                size="sm"
              >
                Mois en cours
              </Button>
            </div>
            <Link href="/dashboard/admin/analytics">
              <Button variant="outline">Rapports détaillés</Button>
            </Link>
          </>
        }
      />

      {(from || to) && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-700">
            Filtre de période :{" "}
            <span className="font-semibold text-green-700">
              {from ? formatDateFr(from) : "début"} —{" "}
              {to ? formatDateFr(to) : "aujourd'hui"}
            </span>
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="admin-grid admin-grid--6">
        {/* Card 1: Utilisateurs */}
        <AdminStatCard
          title="Utilisateurs"
          value={u.total}
          icon={<Users className="size-5" />}
          iconColor="blue"
          label="Utilisateurs inscrits"
          badge={{ label: `${u.clients} clients`, variant: "info" }}
          trend={{ value: u.newUsersPeriod, label: "nouveaux ce mois", up: u.newUsersPeriod > 0 }}
          link="/dashboard/admin/utilisateurs"
        />

        {/* Card 2: Vendeurs - nouveaux inscriptions ce mois */}
        <AdminStatCard
          title="Vendeurs"
          value={u.newVendorsPeriod}
          icon={<Store className="size-5" />}
          iconColor="orange"
          label="Nouveaux vendeurs ce mois"
          badge={{ label: `${u.vendors} vendeurs au total`, variant: "info" }}
          trend={{ value: u.newVendorsPeriod, label: "nouvelles inscriptions", up: u.newVendorsPeriod > 0 }}
          link="/dashboard/admin/vendeurs"
        />

        {/* Card 3: Points de vente créés ce mois */}
        <AdminStatCard
          title="Points de vente"
          value={p.createdPeriod}
          icon={<MapPin className="size-5" />}
          iconColor="green"
          label="Créés ce mois"
          badge={{ label: `${p.total} au total`, variant: "success" }}
          trend={{ value: p.createdPeriod, label: "créés ce mois", up: p.createdPeriod >= 0 }}
          link="/dashboard/admin/points-de-vente"
        />

        {/* Card 4: Disponibilités publiées ce mois */}
        <AdminStatCard
          title="Disponibilités"
          value={d.publishedPeriod}
          icon={<Package className="size-5" />}
          iconColor="purple"
          label="Publiées ce mois"
          badge={{ label: `${d.active} actives`, variant: "info" }}
          trend={{ value: d.publishedPeriod, label: "publiées ce mois", up: d.publishedPeriod >= 0 }}
          link="/dashboard/admin/disponibilites"
        />

        {/* Card 5: Réservations */}
        <AdminStatCard
          title="Réservations"
          value={r.month}
          icon={<Calendar className="size-5" />}
          iconColor="red"
          label="${r.total} ce mois"
          badge={{
            variant: "warning",
            label: `${r.confirmed} confirmées • ${r.pending} en attente • ${r.cancelled} annulées`,
          }}
          trend={{ value: r.month, label: "ce mois", up: r.month >= 0 }}
          link="/dashboard/admin/reservations"
        />

        {/* Card 6: Revenus réels encaissés */}
        <AdminStatCard
          title="Revenus"
          value={rev.confirmed.toLocaleString()}
          icon={<Package className="size-5" />}
          iconColor="emerald"
          label="FCFA encaissés"
          badge={{ label: "Réservations validées", variant: "success" }}
          trend={{ value: 0, label: "vs période précédente", up: true }}
          link="/dashboard/admin/analytics"
        />
      </div>

      <Separator className="admin-separator" />

      {/* Charts Section */}
      <section className="admin-grid admin-grid--2">
        {/* Reservations Chart */}
        <AdminCard title="Réservations par jour" description="Évolution des réservations sur la période sélectionnée" icon={<CalendarIcon className="size-5" />}>
          <div className="h-72 w-full">
            {stats.charts.reservationsByDay.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <CalendarIcon className="size-12 mb-2 text-muted-foreground/30" />
                <p className="text-sm">Aucune réservation sur cette période</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.charts.reservationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [
                      Number(value ?? 0).toLocaleString(),
                      "Réservations",
                    ]}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AdminCard>

        {/* Users Chart */}
        <AdminCard title="Nouveaux utilisateurs par jour" description="Inscriptions (clients, vendeurs, collaborateurs) sur la période" icon={<Users className="size-5" />}>
          <div className="h-72 w-full">
            {stats.charts.usersByDay.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Users className="size-12 mb-2 text-muted-foreground/30" />
                <p className="text-sm">Aucune inscription sur cette période</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.charts.usersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => [
                      Number(value ?? 0).toLocaleString(),
                      "Inscriptions",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: "#3b82f6" }}
                    name="Inscriptions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </AdminCard>
      </section>

      {/* Quick Actions, System Health & Recent Activity - Horizontal on desktop */}
      <section className="admin-grid admin-grid--3">
        {/* Actions rapides */}
        <AdminCard title="Actions rapides" icon={<Archive className="size-5" />}>
          <div className="space-y-2.5">
            <Link href="/dashboard/admin/utilisateurs">
              <Button variant="outline" className="w-full justify-start gap-2.5 h-auto py-2.5 text-sm">
                <Users className="size-4 text-blue-600 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">Gérer les utilisateurs</p>
                  <p className="text-xs text-muted-foreground truncate">{u.total} utilisateurs</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/vendeurs">
              <Button variant="outline" className="w-full justify-start gap-2.5 h-auto py-2.5 text-sm">
                <Store className="size-4 text-orange-600 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">Gérer les vendeurs</p>
                  <p className="text-xs text-muted-foreground truncate">{u.newVendorsPeriod} nouveaux ce mois</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/reservations">
              <Button variant="outline" className="w-full justify-start gap-2.5 h-auto py-2.5 text-sm">
                <Calendar className="size-4 text-red-600 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">Gérer les réservations</p>
                  <p className="text-xs text-muted-foreground truncate">{r.month} ce mois</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/analytics">
              <Button variant="outline" className="w-full justify-start gap-2.5 h-auto py-2.5 text-sm">
                <BarChart3 className="size-4 text-emerald-600 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">Voir les rapports</p>
                  <p className="text-xs text-muted-foreground truncate">Statistiques & exports</p>
                </div>
              </Button>
            </Link>
          </div>
        </AdminCard>

        {/* Santé du système */}
        <AdminCard title="Santé du système" icon={<Shield className="size-5" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Utilisateurs actifs</span>
              <span className="font-semibold ml-2 whitespace-nowrap">
                {u.active} / {u.total}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Vendeurs actifs</span>
              <span className="font-semibold ml-2 whitespace-nowrap">
                {u.vendors} / {u.total}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Points de vente actifs</span>
              <span className="font-semibold ml-2 whitespace-nowrap">
                {p.active} / {p.total}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Dernière actualisation</span>
              <span className="font-semibold ml-2 whitespace-nowrap">
                {new Date().toLocaleTimeString("fr-FR")}
              </span>
            </div>
          </div>
        </AdminCard>

        {/* Activité récente */}
        <AdminCard title="Activité récente" icon={<Activity className="size-5" />}>
          <div className="space-y-2.5">
            {stats.recentActivity?.length > 0 ? (
              stats.recentActivity.slice(0, 10).map((item) => {
                const typeIcons: Record<string, React.ReactNode> = {
                  signup: <Users className="size-3.5" />,
                  point_created: <Package className="size-3.5" />,
                  disponibilite_published: <Clock className="size-3.5" />,
                  reservation_new: <Calendar className="size-3.5" />,
                  reservation_confirmed: <CheckCircle2 className="size-3.5" />,
                  reservation_cancelled: <AlertCircle className="size-3.5" />,
                  account_modified: <Archive className="size-3.5" />,
                };

                const typeLabels: Record<string, string> = {
                  signup: "Nouvelle inscription",
                  point_created: "Nouveau point de vente",
                  disponibilite_published: "Nouvelle disponibilité",
                  reservation_new: "Nouvelle réservation",
                  reservation_confirmed: "Réservation confirmée",
                  reservation_cancelled: "Réservation annulée",
                  account_modified: "Modification de compte",
                };

                const typeClasses: Record<string, string> = {
                  signup: "bg-blue-100 text-blue-600",
                  point_created: "bg-green-100 text-green-600",
                  disponibilite_published: "bg-purple-100 text-purple-600",
                  reservation_new: "bg-red-100 text-red-600",
                  reservation_confirmed: "bg-emerald-100 text-emerald-600",
                  reservation_cancelled: "bg-red-100 text-red-600",
                  account_modified: "bg-orange-100 text-orange-600",
                };

                const Icon = typeIcons[item.type];
                const label = typeLabels[item.type];
                const cls = typeClasses[item.type];

                return (
                  <div key={item.id} className="flex items-center gap-2.5 text-sm">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${cls}`}>
                      {Icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-14 items-center justify-center text-muted-foreground">
                <Activity className="size-6" />
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
          </div>
        </AdminCard>
      </section>

      {/* Pending Reservations Alert - Full width below */}
      {r.pending > 0 && (
        <AdminCard className="border-amber-200 bg-amber-50 mt-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-800">
                {r.pending} réservation(s) en attente
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Des réservations client attendent votre validation.
              </p>
            </div>
            <Link href="/dashboard/admin/reservations?status=pending">
              <Button variant="outline" size="sm">
                Voir les en attente
              </Button>
            </Link>
          </div>
        </AdminCard>
      )}
    </div>
  );
}