"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  History,
  Bell,
  Settings,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string | null;
  brand: string | null;
  format: string | null;
  status: string | null;
  note: string | null;
  quantity: number | null;
  price: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
  source: string | null;
  stale: boolean;
  expired: boolean;
  disponibiliteId: string;
  hasDelivery: boolean;
  hasExchange: boolean;
  hasGasSale: boolean;
  deliveryFee: number | null;
}

interface Reservation {
  id: string;
  reservationCode: string;
  status: string;
  brand: string;
  format: string;
  quantity: number;
  amount: number;
  amountType: string;
  pointName: string;
  pointDistrict: string;
  reservedAt: string;
  collectedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
}

interface Notification {
  id: string;
  type: "reservation" | "availability" | "system" | "promo";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function DashboardOverview() {
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([
    {
      id: "1",
      name: "Total Bonamoussadi",
      district: "Bonamoussadi",
      address: "Rond-point Bonamoussadi",
      phone: "+237 6 99 00 00 00",
      brand: "Total",
      format: "12,5 kg",
      status: "disponible",
      note: "Stock confirmé ce matin",
      quantity: 15,
      price: 6500,
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedBy: "Vendeur",
      source: "vendeur",
      stale: false,
      expired: false,
      disponibiliteId: "disp-1",
      hasDelivery: true,
      hasExchange: true,
      hasGasSale: false,
      deliveryFee: 1000,
    },
    {
      id: "2",
      name: "Bocom Akwa",
      district: "Akwa",
      address: "Boulevard de la Liberté",
      phone: "+237 6 98 00 00 00",
      brand: "Bocom",
      format: "6 kg",
      status: "a_confirmer",
      note: "En attente de confirmation",
      quantity: 8,
      price: 3500,
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedBy: "Administration",
      source: "administration",
      stale: false,
      expired: false,
      disponibiliteId: "disp-2",
      hasDelivery: false,
      hasExchange: true,
      hasGasSale: true,
      deliveryFee: null,
    },
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "1",
      reservationCode: "GP-2024-001234",
      status: "confirmed",
      brand: "Total",
      format: "12,5 kg",
      quantity: 1,
      amount: 1000,
      amountType: "reservation",
      pointName: "Total Bonamoussadi",
      pointDistrict: "Bonamoussadi",
      reservedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      collectedAt: null,
      cancelledAt: null,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      reservationCode: "GP-2024-001235",
      status: "collected",
      brand: "Tradex",
      format: "6 kg",
      quantity: 2,
      amount: 2000,
      amountType: "consigne",
      pointName: "Tradex Akwa",
      pointDistrict: "Akwa",
      reservedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      collectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      cancelledAt: null,
      expiresAt: null,
    },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "reservation",
      title: "Réservation confirmée",
      message: "Votre réservation GP-2024-001234 a été confirmée chez Total Bonamoussadi.",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      link: "/dashboard/reservations",
    },
    {
      id: "2",
      type: "availability",
      title: "Nouvelle disponibilité",
      message: "Total Bonamoussadi a maintenant des bouteilles 12,5 kg disponibles.",
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      link: "/dashboard/recherches",
    },
    {
      id: "3",
      type: "system",
      title: "Mise à jour du service",
      message: "Une nouvelle version de l'application est disponible avec des améliorations.",
      read: false,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [activeTab, setActiveTab] = useState<"overview" | "searches" | "reservations" | "notifications">(
    "overview"
  );

  const router = useRouter();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      disponible: { label: "Disponible", variant: "default" },
      a_confirmer: { label: "À confirmer", variant: "secondary" },
      indisponible: { label: "Indisponible", variant: "destructive" },
      confirmed: { label: "Confirmée", variant: "default" },
      collected: { label: "Récupérée", variant: "secondary" },
      cancelled: { label: "Annulée", variant: "destructive" },
    };
    const config = statusMap[status || ""] || { label: status || "Inconnu", variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "reservation":
        return <Calendar className="size-4 text-blue-500" />;
      case "availability":
        return <Package className="size-4 text-green-500" />;
      case "system":
        return <Settings className="size-4 text-gray-500" />;
      default:
        return <Bell className="size-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bienvenue dans votre espace client GazPoints. Gérez vos recherches, réservations et consultez votre historique.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/dashboard/recherches">
            <Search className="size-4 mr-2" /> Nouvelle recherche
          </Link>} />
          <Button render={<Link href="/dashboard/reservations">
            <Calendar className="size-4 mr-2" /> Mes réservations
          </Link>} />
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 px-1" aria-label="Sections du dashboard">
          {(
            [
              { id: "overview", label: "Vue d'ensemble", icon: <Package className="size-4" /> },
              { id: "searches", label: "Recherches", icon: <Search className="size-4" /> },
              { id: "reservations", label: "Réservations", icon: <Calendar className="size-4" /> },
              { id: "notifications", label: "Notifications", icon: <Bell className="size-4" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground hover:border-transparent"
                )}
              >
                <span className="flex size-5 items-center justify-center">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {/* Overview tab */}
        {activeTab === "overview" && (
          <>
            {/* Quick actions */}
            <section aria-labelledby="quick-actions-heading">
              <h2 id="quick-actions-heading" className="sr-only">Actions rapides</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/recherches" className="group">
                  <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors active:bg-primary active:text-primary-foreground">
                          <Search className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                            Rechercher du gaz
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Trouver des bouteilles disponibles près de chez vous
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/reservations" className="group">
                  <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors active:bg-primary active:text-primary-foreground">
                          <Calendar className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                            Mes réservations
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Voir et gérer vos réservations en cours
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/historique" className="group">
                  <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors active:bg-primary active:text-primary-foreground">
                          <History className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                            Historique
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Consulter vos recherches et achats
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/dashboard/profil" className="group">
                  <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors active:bg-primary active:text-primary-foreground">
                          <User className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                            Mon profil
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Gérer vos informations personnelles
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Recent searches */}
            <section aria-labelledby="recent-searches-heading">
              <div className="flex items-center justify-between mb-4">
                <h2 id="recent-searches-heading" className="text-lg font-semibold">
                  Recherches récentes
                </h2>
                <Link href="/dashboard/recherches" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Voir tout
                  <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {recentSearches.slice(0, 4).map((search) => (
                  <Link key={search.id} href={`/dashboard/recherches?search=${search.id}`} className="group">
                    <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {search.name}
                              </h3>
                              {getStatusBadge(search.status)}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                              <MapPin className="size-3.5 shrink-0" />
                              {search.district} — {search.address}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              {search.brand && (
                                <Badge variant="secondary" className="text-xs">
                                  <Package className="size-2.5 mr-1" /> {search.brand}
                                </Badge>
                              )}
                              {search.format && (
                                <Badge variant="outline" className="text-xs">
                                  <Package className="size-2.5 mr-1" /> {search.format}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <p className="text-xs text-muted-foreground">
                              Maj : {formatDate(search.updatedAt)}
                            </p>
                            <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Upcoming reservations */}
            <section aria-labelledby="upcoming-reservations-heading">
              <div className="flex items-center justify-between mb-4">
                <h2 id="upcoming-reservations-heading" className="text-lg font-semibold">
                  Réservations à venir
                </h2>
                <Link href="/dashboard/reservations" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Voir tout
                  <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {reservations.filter(r => r.status === "confirmed").slice(0, 3).map((res) => (
                  <Link key={res.id} href={`/dashboard/reservations?res=${res.id}`} className="group">
                    <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Package className="size-6" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{res.brand} {res.format}</p>
                              <p className="text-sm text-muted-foreground">
                                {res.pointName} — {res.pointDistrict}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="default">{res.status === "confirmed" ? "Confirmée" : res.status}</Badge>
                            <p className="text-sm text-muted-foreground whitespace-nowrap">
                              Expire : {formatDate(res.expiresAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Searches tab */}
        {activeTab === "searches" && (
          <section aria-labelledby="all-searches-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="all-searches-heading" className="text-lg font-semibold">
                Toutes vos recherches
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentSearches.map((search) => (
                <Link key={search.id} href={`/dashboard/recherches?search=${search.id}`} className="group">
                  <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {search.name}
                            </h3>
                            {getStatusBadge(search.status)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                            <MapPin className="size-3.5 shrink-0" />
                            {search.district} — {search.address}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                            <span className="shrink-0" aria-hidden>📞</span>
                            {search.phone || "Non communiqué"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            {search.brand && (
                              <Badge variant="secondary" className="text-xs">
                                <Package className="size-2.5 mr-1" /> {search.brand}
                              </Badge>
                            )}
                            {search.format && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="size-2.5 mr-1" /> {search.format}
                              </Badge>
                            )}
                            {search.hasDelivery && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="size-2.5 mr-1" /> Livraison
                                {search.deliveryFee && ` (${search.deliveryFee} FCFA)`}
                              </Badge>
                            )}
                            {search.hasExchange && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="size-2.5 mr-1" /> Échange
                              </Badge>
                            )}
                            {search.hasGasSale && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="size-2.5 mr-1" /> Gaz chargé
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs text-muted-foreground">
                            Maj : {formatDate(search.updatedAt)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                router.push("/dashboard/recherches");
                              }}
                              className="group-hover:bg-primary group-hover:text-primary-foreground"
                            >
                              <Search className="size-3 mr-1" /> Rechercher
                            </Button>
                            <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reservations tab */}
        {activeTab === "reservations" && (
          <section aria-labelledby="all-reservations-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="all-reservations-heading" className="text-lg font-semibold">
                Toutes vos réservations
              </h2>
            </div>
            <div className="space-y-3">
              {reservations.map((res) => (
                <Link key={res.id} href={`/dashboard/reservations?res=${res.id}`} className="group">
                  <Card className={cn("border border-border shadow-sm rounded-lg transition-all hover:shadow-md hover:border-primary/50", "group")}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Package className="size-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground truncate">{res.brand} {res.format}</p>
                              {res.amountType === "consigne" && (
                                <Badge variant="secondary" className="text-xs">Consigne</Badge>
                              )}
                              {res.amountType === "mixed" && (
                                <Badge variant="outline" className="text-xs">Mixte</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {res.pointName} — {res.pointDistrict}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Code : {res.reservationCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge
                            variant={
                              res.status === "confirmed" ? "default" :
                              res.status === "collected" ? "secondary" : "destructive"
                            }
                          >
                            {res.status === "confirmed" ? "Confirmée" :
                             res.status === "collected" ? "Récupérée" : "Annulée"}
                          </Badge>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>Réservée : {formatDate(res.reservedAt)}</p>
                            {res.expiresAt && <p>Expire : {formatDate(res.expiresAt)}</p>}
                            {res.collectedAt && <p>Récupérée : {formatDate(res.collectedAt)}</p>}
                            {res.cancelledAt && <p>Annulée : {formatDate(res.cancelledAt)}</p>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <section aria-labelledby="all-notifications-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="all-notifications-heading" className="text-lg font-semibold">
                Notifications
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm"
                onClick={() => {
                  setNotifications((notifs) => notifs.map((n) => ({ ...n, read: true })));
                }}
              >
                Marquer tout comme lu
              </Button>
            </div>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Link key={notif.id} href={notif.link || "#"} className="group">
                  <Card
                    className={cn(
                      "border border-border shadow-sm rounded-lg transition-all hover:shadow-md",
                      notif.read ? "" : "border-primary/30 bg-primary/5"
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className={cn("font-medium text-foreground", !notif.read && "font-semibold")}>
                                {notif.title}
                              </h3>
                              <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDate(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <CheckCircle2 className="size-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}