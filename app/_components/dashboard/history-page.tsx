"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Package, Search, AlertCircle, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Role = "client" | "vendor" | "admin" | "collaborateur";

type HistoryItem = {
  id: string;
  reference: string;
  type: string;
  status: string;
  date: string | null;
  title: string;
  subtitle: string;
  details: Record<string, string | number | null | undefined>;
};

function statusLabel(status: string) {
  switch (status) {
    case "confirmed": return "Confirmée";
    case "collected": return "Récupérée";
    case "cancelled": return "Annulée";
    case "pending": return "En attente";
    case "expired": return "Expirée";
    case "terminee": return "Terminée";
    default: return status || "—";
  }
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed": return "default";
    case "collected":
    case "terminee": return "secondary";
    case "cancelled":
    case "expired": return "destructive";
    default: return "outline";
  }
}

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DashboardHistoryPage({ role }: { role: Role }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let mapped: HistoryItem[] = [];
        if (role === "client") {
          const res = await fetch("/api/reservation/my?page=1&pageSize=100", { headers: { Accept: "application/json" }, cache: "no-store" });
          if (!res.ok) throw new Error("Impossible de charger votre historique.");
          const data = await res.json();
          mapped = (data.reservations || []).map((r: any) => ({
            id: r.id,
            reference: r.reservationCode || r.id,
            type: "Réservation",
            status: r.status || "—",
            date: r.reservedAt || r.createdAt || null,
            title: `${r.brand || ""} ${r.format || ""}`.trim() || "Réservation",
            subtitle: [r.pointName, r.pointDistrict].filter(Boolean).join(" — ") || "Point de vente",
            details: {
              "Référence": r.reservationCode,
              "Statut": statusLabel(r.status),
              "Marque": r.brand,
              "Format": r.format,
              "Quantité": r.quantity,
              "Montant": r.amount != null ? `${r.amount} FCFA` : null,
              "Type de montant": r.amountType,
              "Point de vente": r.pointName,
              "Quartier/Zone": r.pointDistrict,
              "Réservée le": fmt(r.reservedAt),
              "Expire le": fmt(r.expiresAt),
              "Récupérée le": fmt(r.collectedAt),
              "Annulée le": fmt(r.cancelledAt),
            },
          }));
        } else if (role === "vendor") {
          const res = await fetch("/api/reservation/vendor?page=1&pageSize=100", { headers: { Accept: "application/json" }, cache: "no-store" });
          if (!res.ok) throw new Error("Impossible de charger l’historique du dépôt.");
          const data = await res.json();
          mapped = (data.reservations || []).map((r: any) => ({
            id: r.id,
            reference: r.reservationCode || r.id,
            type: "Réservation reçue",
            status: r.status || "—",
            date: r.reservedAt || null,
            title: `${r.brand || ""} ${r.format || ""}`.trim() || "Réservation",
            subtitle: [r.clientName, r.pointName].filter(Boolean).join(" — ") || "Client",
            details: {
              "Référence": r.reservationCode,
              "Statut": r.statusLabel || statusLabel(r.status),
              "Client": r.clientName,
              "Téléphone client": r.clientPhone,
              "Marque": r.brand,
              "Format": r.format,
              "Quantité": r.quantity,
              "Montant": r.amount != null ? `${r.amount} FCFA` : null,
              "Type de montant": r.amountType,
              "Point de vente": r.pointName,
              "Quartier/Zone": r.pointDistrict,
              "Réservée le": fmt(r.reservedAt),
              "Expire le": fmt(r.expiresAt),
              "Récupérée le": fmt(r.collectedAt),
              "Annulée le": fmt(r.cancelledAt),
            },
          }));
        } else {
          const res = await fetch("/api/admin/reservations?page=1&pageSize=100", { headers: { Accept: "application/json" }, cache: "no-store" });
          if (res.status === 403) {
            throw new Error("Vous n’avez pas accès à l’historique des réservations.");
          }
          if (!res.ok) throw new Error("Impossible de charger l’historique.");
          const data = await res.json();
          mapped = (data.reservations || []).map((r: any) => ({
            id: r.id,
            reference: r.reservationCode || r.id,
            type: "Opération réservation",
            status: r.status || "—",
            date: r.reservedAt || null,
            title: `${r.brand || ""} ${r.format || ""}`.trim() || "Réservation",
            subtitle: [r.clientName, r.pointName].filter(Boolean).join(" — ") || "Opération",
            details: {
              "Référence": r.reservationCode,
              "Statut": statusLabel(r.status),
              "Client": r.clientName,
              "Téléphone client": r.clientPhone,
              "Compte client": r.clientUserName || r.clientUserEmail,
              "Marque": r.brand,
              "Format": r.format,
              "Quantité": r.quantity,
              "Montant": r.amount != null ? `${r.amount} FCFA` : null,
              "Type de montant": r.amountType,
              "Point de vente": r.pointName,
              "Quartier/Zone": r.pointDistrict,
              "ID point de vente": r.pointId,
              "ID vendeur": r.vendorId,
              "Réservée le": fmt(r.reservedAt),
              "Expire le": fmt(r.expiresAt),
              "Récupérée le": fmt(r.collectedAt),
              "Annulée le": fmt(r.cancelledAt),
            },
          }));
        }
        if (!cancelled) setItems(mapped);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur lors du chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (!q) return true;
      return [it.reference, it.title, it.subtitle, it.type, statusLabel(it.status)]
        .join(" ")
        .toLower()
        .includes(q);
    });
  }, [items, query, statusFilter]);

  const description =
    role === "client"
      ? "Vos réservations réellement enregistrées."
      : role === "vendor"
      ? "Réservations reçues et opérations réelles sur vos points de vente."
      : "Événements et opérations réels accessibles selon vos droits.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="size-3 mr-2" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Rechercher par référence, type, statut…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="collected">Récupérée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="expired">Expirée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Chargement de l’historique…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="size-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">Aucune opération</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {query || statusFilter !== "all" ? "Aucun élément ne correspond à vos filtres." : "Aucune opération réelle enregistrée pour le moment."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40" onClick={() => setSelected(item)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                        <Badge variant={statusVariant(item.status)} className="text-xs">{statusLabel(item.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">Réf. {item.reference} · {fmt(item.date)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={(e) => { e.stopPropagation(); setSelected(item); }}>
                    <Eye className="size-4 mr-1" /> Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l’opération</DialogTitle>
            <DialogDescription>{selected ? `${selected.type} · Réf. ${selected.reference}` : ""}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              {Object.entries(selected.details).map(([k, v]) => (
                v == null || v === "" ? null : (
                  <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right break-all">{String(v)}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
