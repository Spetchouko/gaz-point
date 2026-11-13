"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Search, Calendar, Package, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchHistoryItem {
  id: string;
  brand: string | null;
  format: string | null;
  zone: string | null;
  resultsCount: number;
  searchedAt: string;
}

interface ReservationHistoryItem {
  id: string;
  reservationCode: string;
  brand: string;
  format: string;
  quantity: number;
  amount: number;
  amountType: string;
  pointName: string;
  pointDistrict: string;
  status: string;
  reservedAt: string;
  collectedAt: string | null;
  cancelledAt: string | null;
}

export default function HistoriquePage() {
  const [activeTab, setActiveTab] = useState<"searches" | "reservations">("searches");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const searchHistory: SearchHistoryItem[] = [
    { id: "1", brand: "Total", format: "12,5 kg", zone: "Bonamoussadi", resultsCount: 3, searchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: "2", brand: "Bocom", format: "6 kg", zone: "Akwa", resultsCount: 1, searchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: "3", brand: "Tradex", format: null, zone: "Makepe", resultsCount: 2, searchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: "4", brand: "Bocom", format: "12,5 kg", zone: "Deido", resultsCount: 0, searchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    { id: "5", brand: null, format: "6 kg", zone: "Bonanjo", resultsCount: 2, searchedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
  ];

  const reservationHistory: ReservationHistoryItem[] = [
    { id: "1", reservationCode: "GP-2024-001234", brand: "Total", format: "12,5 kg", quantity: 1, amount: 1000, amountType: "reservation", pointName: "Total Bonamoussadi", pointDistrict: "Bonamoussadi", status: "collected", reservedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), collectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), cancelledAt: null },
    { id: "2", reservationCode: "GP-2024-001235", brand: "Tradex", format: "6 kg", quantity: 2, amount: 2000, amountType: "consigne", pointName: "Tradex Akwa", pointDistrict: "Akwa", status: "collected", reservedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), collectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), cancelledAt: null },
    { id: "3", reservationCode: "GP-2024-001236", brand: "Bocom", format: "12,5 kg", quantity: 1, amount: 1500, amountType: "mixed", pointName: "Bocom Makepe", pointDistrict: "Makepe", status: "confirmed", reservedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), collectedAt: null, cancelledAt: null },
    { id: "4", reservationCode: "GP-2024-001237", brand: "SCTM", format: "6 kg", quantity: 1, amount: 1000, amountType: "reservation", pointName: "SCTM Deido", pointDistrict: "Deido", status: "cancelled", reservedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), collectedAt: null, cancelledAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString() },
  ];

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
          <p className="text-muted-foreground">Consultez l'historique de vos recherches et réservations</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1 px-1" aria-label="Sections de l'historique">
          {[
            { id: "searches", label: "Recherches", icon: <Search className="size-4" /> },
            { id: "reservations", label: "Réservations", icon: <Calendar className="size-4" /> },
          ].map((tab) => (
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toute la période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la période</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === "searches" && (
        <section aria-labelledby="search-history-heading">
          <h2 id="search-history-heading" className="sr-only">Historique des recherches</h2>
          <div className="space-y-3">
            {searchHistory
              .filter((item) => {
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  return (
                    (item.brand?.toLowerCase().includes(query) || false) ||
                    (item.format?.toLowerCase().includes(query) || false) ||
                    (item.zone?.toLowerCase().includes(query) || false)
                  );
                }
                return true;
              })
              .map((item) => (
                <Link key={item.id} href="/dashboard/recherches" className="group">
                  <Card className="transition-all hover:shadow-md hover:border-primary/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Search className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground truncate">
                                {item.brand || "Toutes marques"} {item.format ? `— ${item.format}` : ""}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                              <MapPin className="size-3.5 shrink-0" /> {item.zone || "Toutes zones"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.resultsCount} résultat{item.resultsCount > 1 ? "s" : ""} trouvé{item.resultsCount > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(item.searchedAt)}
                          </p>
                          <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                            <Search className="size-3 mr-1" /> Refaire
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </section>
      )}

      {activeTab === "reservations" && (
        <section aria-labelledby="reservation-history-heading">
          <h2 id="reservation-history-heading" className="sr-only">Historique des réservations</h2>
          <div className="space-y-3">
            {reservationHistory.map((res) => (
              <Link key={res.id} href={`/dashboard/reservations/${res.id}`} className="group">
                <Card className="transition-all hover:shadow-md hover:border-primary/50">
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
                          <p>Réservée : {formatDateShort(res.reservedAt)}</p>
                          {res.collectedAt && <p className="text-green-600">Récupérée : {formatDateShort(res.collectedAt)}</p>}
                          {res.cancelledAt && <p className="text-red-600">Annulée : {formatDateShort(res.cancelledAt)}</p>}
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
    </div>
  );
}
