"use client";

export const dynamic = "force-dynamic";

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
  period: { from: string; to: string };
  charts: {
    reservationsByDay: Array<{ date: string; count: number }>;
    usersByDay: Array<{ date: string; count: number }>;
  };
}

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

  const formatDateFr = (iso: string) => {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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
        <AdminStatCard
          title="Utilisateurs"
          value={u.total}
          icon={<Users className="size-5" />}
          iconColor="blue"
          label="Total utilisateurs"
          badge={{ label: "Clients", variant: "info" }}
          trend={{ value: u.newUsersPeriod, label: "nouveaux ce mois", up: u.newUsersPeriod >= 0 }}
          link="/dashboard/admin/utilisateurs"
        />
        <AdminStatCard
          title="Vendeurs"
          value={u.vendors}
          icon={<Store className="size-5" />}
          iconColor="orange"
          label="Vendeurs actifs"
          badge={{ label: "Actifs", variant: "success" }}
          trend={{ value: u.newVendorsPeriod, label: "nouveaux ce mois", up: u.newVendorsPeriod >= 0 }}
          link="/dashboard/admin/vendeurs"
        />
        <AdminStatCard
          title="Points de vente"
          value={p.total}
          icon={<MapPin className="size-5" />}
          iconColor="green"
          label="Points de vente"
          badge={{ label: "Actifs", variant: "success" }}
          trend={{ value: p.createdPeriod, label: "créés ce mois", up: p.createdPeriod >= 0 }}
          link="/dashboard/admin/points-de-vente"
        />
        <AdminStatCard
          title="Disponibilités"
          value={d.total}
          icon={<Package className="size-5" />}
          iconColor="purple"
          label={`${d.active} disponibles`}
          badge={{ label: "Publiées", variant: "info" }}
          trend={{ value: d.publishedPeriod, label: "publiées ce mois", up: d.publishedPeriod >= 0 }}
          link="/dashboard/admin/disponibilites"
        />
        <AdminStatCard
          title="Réservations"
          value={r.total}
          icon={<Calendar className="size-5" />}
          iconColor="red"
          label={`${r.pending} en attente`}
          badge={{ label: "En attente", variant: "warning" }}
          trend={{ value: r.month, label: "ce mois", up: r.month >= 0 }}
          link="/dashboard/admin/reservations"
        />
        <AdminStatCard
          title="Revenus"
          value={r.confirmed * 5000}
          icon={<Package className="size-5" />}
          iconColor="emerald"
          label="estimés ce mois"
          badge={{ label: "Ce mois", variant: "success" }}
          trend={{ value: 12, label: "vs mois dernier", up: true }}
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
                  <p className="text-xs text-muted-foreground truncate">{u.vendors} vendeurs</p>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/admin/reservations">
              <Button variant="outline" className="w-full justify-start gap-2.5 h-auto py-2.5 text-sm">
                <Calendar className="size-4 text-red-600 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium truncate">Gérer les réservations</p>
                  <p className="text-xs text-muted-foreground truncate">{r.pending} en attente</p>
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
              <span className="font-semibold ml-2 whitespace-nowrap">{u.active} / {u.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Vendeurs actifs</span>
              <span className="font-semibold ml-2 whitespace-nowrap">{u.vendors}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Points de vente actifs</span>
              <span className="font-semibold ml-2 whitespace-nowrap">{p.active} / {p.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">Réservations ce mois</span>
              <span className="font-semibold ml-2 whitespace-nowrap">{r.month}</span>
            </div>
          </div>
        </AdminCard>

        {/* Activité récente */}
        <AdminCard title="Activité récente" icon={<Activity className="size-5" />}>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">Nouveau client inscrit</p>
                <p className="text-xs text-muted-foreground">Il y a 10 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Store className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">Nouveau vendeur inscrit</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{r.pending} réservations en attente</p>
                <p className="text-xs text-muted-foreground">Nécessitent une action</p>
              </div>
            </div>
            <Link href="/dashboard/admin/analytics" className="text-sm text-primary hover:underline block text-center mt-1">
              Voir tout l&apos;historique →
            </Link>
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