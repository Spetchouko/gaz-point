"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, AlertCircle, Calendar, Package, Mail, Shield, X, Filter, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "reservation" | "availability" | "system" | "promo";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const notifications: Notification[] = [
    { id: "1", type: "reservation", title: "Réservation confirmée", message: "Votre réservation GP-2024-001234 a été confirmée chez Total Bonamoussadi.", read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), link: "/dashboard/reservations" },
    { id: "2", type: "availability", title: "Nouvelle disponibilité", message: "Total Bonamoussadi a maintenant des bouteilles 12,5 kg disponibles.", read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
    { id: "3", type: "system", title: "Mise à jour du service", message: "Une nouvelle version de l'application est disponible avec des améliorations.", read: false, createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
    { id: "4", type: "promo", title: "Offre spéciale", message: "Profitez de -10% sur vos réservations cette semaine.", read: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
    { id: "5", type: "reservation", title: "Réservation expirée", message: "Votre réservation GP-2024-001230 a expiré sans être récupérée.", read: true, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), link: "/dashboard/reservations" },
    { id: "6", type: "availability", title: "Stock mis à jour", message: "Bocom Makepe a mis à jour son stock de bouteilles 6 kg.", read: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), link: "/dashboard/recherches" },
  ];

  const filteredNotifications = notifications
    .filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterRead === "unread" && n.read) return false;
      if (filterRead === "read" && !n.read) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Restez informé de vos réservations et des nouveautés</p>
        </div>
        {notifications.filter((n) => !n.read).length > 0 && (
          <Button variant="outline" size="sm" className="text-sm">
            <Check className="size-3 mr-1" /> Marquer tout comme lu
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="reservation">Réservations</SelectItem>
                <SelectItem value="availability">Disponibilités</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="promo">Promotions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Lu / Non lu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="unread">Non lus ({notifications.filter(n => !n.read).length})</SelectItem>
                <SelectItem value="read">Lus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications list */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="size-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Aucune notification</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || filterType !== "all" || filterRead !== "all"
                  ? "Aucune notification ne correspond à vos filtres."
                  : "Vous n'avez aucune notification pour le moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <Link key={notif.id} href={notif.link || "#"} className="group">
                <Card
                  className={cn(
                    "transition-all hover:shadow-md",
                    notif.read ? "" : "border-primary/30 bg-primary/5"
                  )}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {(() => {
                          switch (notif.type) {
                            case "reservation": return <Calendar className="size-4 text-blue-500" />;
                            case "availability": return <Package className="size-4 text-green-500" />;
                            case "system": return <Shield className="size-4 text-gray-500" />;
                            case "promo": return <AlertCircle className="size-4 text-amber-500" />;
                            default: return <Bell className="size-4 text-gray-500" />;
                          }
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={cn("font-medium text-foreground", !notif.read && "font-semibold")}>
                                {notif.title}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {(() => {
                                  switch (notif.type) {
                                    case "reservation": return "Réservation";
                                    case "availability": return "Disponibilité";
                                    case "system": return "Système";
                                    case "promo": return "Promotion";
                                    default: return notif.type;
                                  }
                                })()}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {formatDate(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "À l'instant";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}