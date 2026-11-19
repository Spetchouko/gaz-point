"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Package, AlertCircle, ArrowLeft, Store, User, Truck, Loader2, Trash2, Edit2, MapPin, Package as PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Spinner } from "@/app/_components/spinner";
import { toast } from "sonner";
import { AdminPageHeader, AdminCard, AdminTable, AdminBadge } from "@/app/_components/dashboard/admin";

const pointSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  district: z.string().min(1, "Le district est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  phone: z.string().nullable().optional(),
  brands: z.array(z.string()).default([]),
  formats: z.array(z.string()).default([]),
  deliveryEnabled: z.boolean().default(false),
  deliveryFee: z.coerce.number().default(0),
  exchangeEnabled: z.boolean().default(false),
  gasSaleEnabled: z.boolean().default(false),
  isActive: z.boolean().default(true),
  vendorId: z.string().nullable().optional(),
});

type PointFormValues = z.infer<typeof pointSchema>;

interface PointDeVente {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string | null;
  brands: string[] | null;
  formats: string[] | null;
  deliveryEnabled: boolean;
  deliveryFee: number;
  exchangeEnabled: boolean;
  gasSaleEnabled: boolean;
  vendorId: string | null;
  vendorName: string | null;
  vendorEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPointsDeVentePage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [points, setPoints] = useState<PointDeVente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<PointDeVente | null>(null);

  const form = useForm<PointFormValues>({
    resolver: zodResolver(pointSchema),
    defaultValues: {
      name: "", district: "", address: "", phone: null, brands: [], formats: [],
      deliveryEnabled: false, deliveryFee: 0, exchangeEnabled: false, gasSaleEnabled: false,
      isActive: true, vendorId: null,
    },
  });

  const loadPoints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("page", "1");
      params.set("pageSize", "50");

      const res = await fetch(`/api/admin/points-de-vente?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Impossible de charger les points de vente");
      const data = await res.json();
      setPoints(data.points ?? []);
      setError(null);
    } catch {
      setError("Impossible de charger les points de vente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadPoints();
    return () => { cancelled = true; };
  }, [searchQuery, filterStatus]);

  const handleEditSubmit = async (values: PointFormValues) => {
    if (!editItem) return;
    setSaving((prev) => new Set([...prev, editItem.id]));
    try {
      const res = await fetch(`/api/admin/points-de-vente/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          district: values.district,
          address: values.address,
          phone: values.phone || null,
          brands: values.brands,
          formats: values.formats,
          deliveryEnabled: values.deliveryEnabled,
          deliveryFee: values.deliveryFee,
          exchangeEnabled: values.exchangeEnabled,
          gasSaleEnabled: values.gasSaleEnabled,
          isActive: values.isActive,
          vendorId: values.vendorId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de la modification");
      setEditDialog(false);
      form.reset();
      await loadPoints();
      toast.success("Point de vente mis à jour avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(editItem.id);
        return next;
      });
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    setSaving((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/admin/points-de-vente/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error("Échec de la modification");
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p))
      );
      toast.success(`Dépôt ${!isActive ? "réactivé" : "suspendu"} avec succès`);
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

  const columns = [
    {
      key: "depot",
      header: "Dépôt",
      render: (p: PointDeVente) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-green-50 text-green-700">
            <Store className="size-4" />
          </div>
          <p className="font-medium text-foreground truncate max-w-xs">{p.name}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "District / Adresse",
      render: (p: PointDeVente) => (
        <div className="text-muted-foreground">
          <p className="text-sm">{p.district}</p>
          <p className="text-xs truncate max-w-xs">{p.address}</p>
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendeur",
      render: (p: PointDeVente) => (
        <div className="text-muted-foreground">
          <p className="text-sm truncate max-w-xs">{p.vendorName || "—"}</p>
          {p.vendorEmail && <p className="text-xs truncate max-w-xs">{p.vendorEmail}</p>}
        </div>
      ),
    },
    {
      key: "brands",
      header: "Marques / Formats",
      render: (p: PointDeVente) => (
        <div className="text-muted-foreground text-xs">
          <p>{(p.brands || []).slice(0, 3).join(", ") || "—"}</p>
          <p>{(p.formats || []).slice(0, 3).join(", ") || "—"}</p>
        </div>
      ),
    },
    {
      key: "services",
      header: "Services",
      render: (p: PointDeVente) => (
        <div className="flex flex-wrap gap-1 text-xs">
          {p.deliveryEnabled && <AdminBadge variant="info" className="text-[10px]">Livraison</AdminBadge>}
          {p.exchangeEnabled && <AdminBadge variant="neutral" className="text-[10px]">Échange</AdminBadge>}
          {p.gasSaleEnabled && <AdminBadge variant="success" className="text-[10px]">Vente gaz</AdminBadge>}
          {!p.deliveryEnabled && !p.exchangeEnabled && !p.gasSaleEnabled && <span className="text-xs text-muted-foreground italic">—</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (p: PointDeVente) => (
        <AdminBadge variant={p.isActive ? "success" : "neutral"}>
          {p.isActive ? "Actif" : "Suspendu"}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      headerClassName: "text-right",
      render: (p: PointDeVente) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditItem(p);
              form.reset({
                name: p.name,
                district: p.district,
                address: p.address,
                phone: p.phone,
                brands: p.brands || [],
                formats: p.formats || [],
                deliveryEnabled: p.deliveryEnabled,
                deliveryFee: p.deliveryFee,
                exchangeEnabled: p.exchangeEnabled,
                gasSaleEnabled: p.gasSaleEnabled,
                isActive: p.isActive,
                vendorId: p.vendorId,
              });
              setEditDialog(true);
            }}
            disabled={saving.has(p.id)}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStatus(p.id, p.isActive)}
            disabled={saving.has(p.id)}
          >
            {p.isActive ? "Suspendre" : "Réactiver"}
          </Button>
        </div>
      ),
    },
  ];

  const filtered = points.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    }
    return true;
  }).filter((p) => {
    if (filterStatus === "active") return p.isActive;
    if (filterStatus === "inactive") return !p.isActive;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="admin-section">
      <AdminPageHeader
        title="Points de vente (dépôts)"
        subtitle="Consultez et gérez les dépôts de gaz et leurs vendeurs associés"
        icon={<Store className="size-5" />}
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
              placeholder="Rechercher par nom, district, adresse..."
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
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Suspendus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <AdminTable
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          emptyMessage="Aucun point de vente trouvé"
          emptyIcon={<Store className="size-8" />}
        />
      </AdminCard>

      {/* Dialog modification */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le point de vente</DialogTitle>
            <DialogDescription>
              Modifiez les informations du dépôt. Les changements sont immédiatement enregistrés.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du dépôt</FormLabel>
                      <FormControl>
                        <Input {...field} className="admin-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District / Quartier</FormLabel>
                      <FormControl>
                        <Input {...field} className="admin-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète</FormLabel>
                      <FormControl>
                        <Input {...field} className="admin-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} placeholder="+237 ..." className="admin-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <FormLabel>Marques acceptées</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {["Butagaz", "Total", "Camgaz", "Sodigaz", "Vitogaz", "Autre"].map((b) => (
                      <label key={b} className="flex items-center gap-2 cursor-pointer select-none rounded-lg border p-2 hover:bg-green-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.getValues("brands").includes(b)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("brands");
                            form.setValue("brands", checked
                              ? [...current, b]
                              : current.filter((v: string) => v !== b)
                            );
                          }}
                          className="accent-green-600"
                        />
                        <span className="text-sm">{b}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <FormLabel>Formats de bouteilles</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {["6 kg", "12,5 kg", "15 kg"].map((f) => (
                      <label key={f} className="flex items-center gap-2 cursor-pointer select-none rounded-lg border p-2 hover:bg-green-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={form.getValues("formats").includes(f)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("formats");
                            form.setValue("formats", checked
                              ? [...current, f]
                              : current.filter((v: string) => v !== f)
                            );
                          }}
                          className="accent-green-600"
                        />
                        <span className="text-sm">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="deliveryEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livraison à domicile</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-green-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de livraison (FCFA)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="admin-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exchangeEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Échange de bouteille</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-green-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gasSaleEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vente de bouteille chargée</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-green-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendeur associé</FormLabel>
                      <FormControl>
                        <Select {...field} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Aucun vendeur associé" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dépôt actif</FormLabel>
                      <FormControl>
                        <input type="checkbox" {...field} className="accent-green-600" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || saving.has(editItem!.id)}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}