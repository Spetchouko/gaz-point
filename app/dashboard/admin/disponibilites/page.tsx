"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Package, AlertCircle, ArrowLeft, Clock, User, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";
import { toast } from "sonner";
import { AdminPageHeader, AdminCard, AdminTable, AdminBadge } from "@/app/_components/dashboard/admin";

interface AdminDisponibilite {
  id: string;
  brand: string;
  format: string;
  status: string;
  quantity: number | null;
  reservedQuantity: number | null;
  price: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  pointId: string;
  vendorId: string;
  pointName: string | null;
  pointDistrict: string | null;
  vendorName: string | null;
  vendorEmail: string | null;
}

const statusLabel = (status: string) => {
  switch (status) {
    case "disponible": return "Disponible";
    case "indisponible": return "Indisponible";
    case "a_confirmer": return "À confirmer";
    default: return status;
  }
};

const statusVariant = (status: string) => {
  switch (status) {
    case "disponible": return "success";
    case "indisponible": return "destructive";
    case "a_confirmer": return "warning";
    default: return "neutral";
  }
};

export default function AdminDisponibilitesPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [disponibilites, setDisponibilites] = useState<AdminDisponibilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function loadDisponibilites() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterStatus !== "all") params.set("status", filterStatus);
        if (searchQuery) params.set("search", searchQuery);
        params.set("page", "1");
        params.set("pageSize", "50");

        const res = await fetch(`/api/admin/disponibilites?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Impossible de charger les disponibilités");
        const data = await res.json();
        if (!cancelled) {
          setDisponibilites(data.disponibilites ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les disponibilités");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDisponibilites();
    return () => { cancelled = true; };
  }, [filterStatus, searchQuery]);

  const updateStatus = async (id: string, status: string) => {
    setSaving((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/admin/disponibilites/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Échec de la modification");
      setDisponibilites((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
      toast.success("Disponibilité mise à jour avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredDisponibilites = disponibilites.filter((d) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.brand.toLowerCase().includes(q) ||
        d.format.toLowerCase().includes(q) ||
        d.pointName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const columns = [
    {
      key: "bouteille",
      header: "Bouteille",
      render: (d: AdminDisponibilite) => (
        <div className="flex items-center gap-3">
          <Package className="size-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{d.brand} {d.format}</p>
            {d.note && <p className="text-xs text-muted-foreground truncate">{d.note}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "point",
      header: "Point de vente",
      render: (d: AdminDisponibilite) => (
        <div>
          <p className="font-medium text-foreground truncate">{d.pointName || "—"}</p>
          {d.pointDistrict && <p className="text-xs text-muted-foreground truncate">{d.pointDistrict}</p>}
        </div>
      ),
    },
    {
      key: "vendeur",
      header: "Vendeur",
      render: (d: AdminDisponibilite) => (
        <span className="text-muted-foreground truncate block max-w-xs">{d.vendorName || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (d: AdminDisponibilite) => (
        <AdminBadge variant={statusVariant(d.status)}>
          {statusLabel(d.status)}
        </AdminBadge>
      ),
    },
    {
      key: "price",
      header: "Prix",
      render: (d: AdminDisponibilite) => (
        <span className={d.price != null ? "font-medium" : "text-muted-foreground"}>
          {d.price != null ? d.price + " FCFA" : "—"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Quantité",
      render: (d: AdminDisponibilite) => (
        <span className="text-muted-foreground">
          {d.quantity != null ? d.quantity : "—"}
          {d.reservedQuantity != null && d.reservedQuantity > 0 && (
            <span className="text-xs text-muted-foreground ml-1">({d.reservedQuantity} rés.)</span>
          )}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      render: (d: AdminDisponibilite) => (
        <Select
          value={d.status}
          onValueChange={(value) => updateStatus(d.id, value)}
          disabled={saving.has(d.id)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={statusLabel(d.status)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="indisponible">Indisponible</SelectItem>
            <SelectItem value="a_confirmer">À confirmer</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="admin-section">
      <AdminPageHeader
        title="Gestion des disponibilités"
        subtitle="Consultez et modifiez les disponibilités publiées par les vendeurs"
        icon={<Package className="size-5" />}
        actions={
          <Link href="/dashboard/admin">
            <Button variant="outline">
              <ArrowLeft className="size-4 mr-2" /> Retour
            </Button>
          </Link>
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

      <AdminCard>
        <div className="admin-grid admin-grid--4 mb-4">
          <div className="relative flex-1 sm:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par marque, format, dépôt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 admin-input"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="disponible">Disponibles</SelectItem>
              <SelectItem value="indisponible">Indisponibles</SelectItem>
              <SelectItem value="a_confirmer">À confirmer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminTable
          columns={columns}
          data={filteredDisponibilites}
          keyExtractor={(d) => d.id}
          emptyMessage="Aucune disponibilité trouvée"
          emptyIcon={<Package className="size-8" />}
        />
      </AdminCard>
    </div>
  );
}