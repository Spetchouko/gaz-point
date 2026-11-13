"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Filter, X, Download, Package, Clock, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  reservationCode: string;
  status: "confirmed" | "collected" | "cancelled";
  brand: string;
  format: string;
  quantity: number;
  amount: number;
  amountType: "reservation" | "consigne" | "mixed";
  pointName: string;
  pointDistrict: string;
  reservedAt: string;
  collectedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
}

export default function ReservationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "status">("date_desc");

  const reservations: Reservation[] = [
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
    {
      id: "3",
      reservationCode: "GP-2024-001236",
      status: "confirmed",
      brand: "Bocom",
      format: "12,5 kg",
      quantity: 1,
      amount: 1500,
      amountType: "mixed",
      pointName: "Bocom Makepe",
      pointDistrict: "Makepe",
      reservedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      collectedAt: null,
      cancelledAt: null,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      reservationCode: "GP-2024-001237",
      status: "cancelled",
      brand: "SCTM",
      format: "6 kg",
      quantity: 1,
      amount: 1000,
      amountType: "reservation",
      pointName: "SCTM Deido",
      pointDistrict: "Deido",
      reservedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      collectedAt: null,
      cancelledAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
      expiresAt: null,
    },
  ];

  const filteredReservations = reservations
    .filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          r.reservationCode.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
          r.pointName.toLowerCase().includes(query) ||
          r.pointDistrict.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.reservedAt).getTime() - new Date(b.reservedAt).getTime();
      if (sortBy === "date_desc") return new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime();
      return 0;
    });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmée", variant: "default" as const, icon: <CheckCircle2 className="size-3" /> };
      case "collected":
        return { label: "Récupérée", variant: "secondary" as const, icon: <CheckCircle2 className="size-3" /> };
      case "cancelled":
        return { label: "Annulée", variant: "destructive" as const, icon: <AlertCircle className="size-3" /> };
      default:
        return { label: status, variant: "outline" as const, icon: null };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes réservations</h1>
          <p className="text-muted-foreground">Suivez et gérez vos réservations de bouteilles de gaz</p>
        </div>
        <Button variant="outline" render={<Link href="/dashboard/recherches">
          <Package className="size-4 mr-2" /> Nouvelle réservation
        </Link>} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, marque, point de vente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="collected">Récupérées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récentes</SelectItem>
                <SelectItem value="date_asc">Plus anciennes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations list */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="size-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Aucune réservation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || filterStatus !== "all"
                  ? "Aucune réservation ne correspond à vos filtres."
                  : "Vous n'avez pas encore de réservations. Commencez par rechercher du gaz !"}
              </p>
              <Button render={<Link href="/dashboard/recherches">Rechercher du gaz</Link>} className="mt-4" variant="outline" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((res) => (
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
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              res.status === "confirmed" ? "default" :
                              res.status === "collected" ? "secondary" : "destructive"
                            }
                            className="group-hover:bg-primary/90 group-hover:text-primary-foreground"
                          >
                            {res.status === "confirmed" ? "Confirmée" :
                             res.status === "collected" ? "Récupérée" : "Annulée"}
                          </Badge>
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0 min-w-[200px]">
                          <p>Réservée : {new Date(res.reservedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>
                          {res.expiresAt && <p>Expire : {new Date(res.expiresAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>}
                          {res.collectedAt && <p className="text-green-600">Récupérée : {new Date(res.collectedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>}
                          {res.cancelledAt && <p className="text-red-600">Annulée : {new Date(res.cancelledAt).toLocaleDateString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}</p>}
                        </div>
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