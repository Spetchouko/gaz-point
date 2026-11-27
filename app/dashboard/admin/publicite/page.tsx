"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Truck,
  AlertCircle,
  ArrowLeft,
  Image,
  Link as LinkIcon,
  Play,
  Pause,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Clock2,
  Plus,
  Loader2,
  X,
  Check,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AdminPageHeader } from "@/app/_components/dashboard/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PubliciteItem {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number | null;
  priceLabel: string | null;
  location: string | null;
  phone: string | null;
  linkUrl: string | null;
  slot: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  duration: number | null;
  priority: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const slotLabels: Record<string, string> = {
  home_hero: "Accueil — sous la bannière",
  home_search: "Accueil — au-dessus de « Trouver mon Gaz »",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  active: "En cours",
  expired: "Terminée",
  suspended: "Suspendue",
};

function SkeletonRow() {
  return (
    <tr className="border-b animate-pulse">
      <td className="py-3 px-4"><div className="h-10 w-10 rounded-lg bg-muted" /></td>
      <td className="py-3 px-4">
        <div className="h-4 w-3/4 bg-muted rounded mb-2" />
        <div className="h-3 w-1/2 bg-muted rounded" />
      </td>
      <td className="py-3 px-4"><div className="h-3 w-24 bg-muted rounded" /></td>
      <td className="py-3 px-4"><div className="h-5 w-20 bg-muted rounded-full" /></td>
      <td className="py-3 px-4"><div className="h-3 w-28 bg-muted rounded" /></td>
      <td className="py-3 px-4"><div className="h-3 w-24 bg-muted rounded" /></td>
      <td className="py-3 px-4"><div className="h-5 w-16 bg-muted rounded" /></td>
    </tr>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "destructive" | "default" | "outline";
  onConfirm: () => void;
  isLoading: boolean;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant,
  onConfirm,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {confirmVariant === "destructive" && <AlertCircle className="size-5 text-destructive" />}
            {confirmVariant !== "destructive" && <Check className="size-5 text-primary" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Traitement...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPublicitePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSlot, setFilterSlot] = useState<string>("all");
  const [publicites, setPublicites] = useState<PubliciteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  // États pour les modales de confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PubliciteItem | null>(null);
  const [dialogAction, setDialogAction] = useState<"delete" | "status" | "suspend" | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPublicites() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (filterStatus !== "all") params.set("status", filterStatus);
        if (filterSlot !== "all") params.set("slot", filterSlot);
        params.set("page", "1");
        params.set("pageSize", "50");

        const res = await fetch(`/api/admin/publicite?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Impossible de charger les annonces");
        const data = await res.json();
        if (!cancelled) {
          setPublicites(data.publicites ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les annonces");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPublicites();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, filterStatus, filterSlot]);

  const openDialog = (action: "delete" | "status" | "suspend", item: PubliciteItem) => {
    setSelectedItem(item);
    setDialogAction(action);
    if (action === "delete") setDeleteDialogOpen(true);
    else if (action === "status") setStatusDialogOpen(true);
    else if (action === "suspend") setSuspendDialogOpen(true);
  };

  const closeAllDialogs = () => {
    setDeleteDialogOpen(false);
    setStatusDialogOpen(false);
    setSuspendDialogOpen(false);
    setSelectedItem(null);
    setDialogAction(null);
    setDialogLoading(false);
  };

  const executeAction = async () => {
    if (!selectedItem || !dialogAction) return;
    setDialogLoading(true);
    try {
      if (dialogAction === "delete") {
        const res = await fetch(`/api/admin/publicite/${selectedItem.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Échec de la suppression");
        setPublicites((prev) => prev.filter((p) => p.id !== selectedItem.id));
        toast.success("Annonce supprimée");
      } else if (dialogAction === "status") {
        const newStatus = selectedItem.status === "active" ? "draft" : "active";
        const res = await fetch(`/api/admin/publicite/${selectedItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Échec de la modification");
        setPublicites((prev) =>
          prev.map((p) => (p.id === selectedItem.id ? { ...p, status: newStatus } : p))
        );
        toast.success(newStatus === "active" ? "Annonce activée" : "Annonce désactivée");
      } else if (dialogAction === "suspend") {
        const newStatus = selectedItem.status === "suspended" ? "active" : "suspended";
        const res = await fetch(`/api/admin/publicite/${selectedItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Échec de la modification");
        setPublicites((prev) =>
          prev.map((p) => (p.id === selectedItem.id ? { ...p, status: newStatus } : p))
        );
        toast.success(newStatus === "active" ? "Diffusion reprise" : "Diffusion suspendue");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'opération");
    } finally {
      setDialogLoading(false);
      closeAllDialogs();
    }
  };

  const toggleStatus = async (id: string, status: string) => {
    setSaving((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/admin/publicite/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Échec de la modification");
      setPublicites((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
      toast.success("Statut de l'annonce mis à jour");
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

  const toggleSuspend = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    await toggleStatus(id, newStatus);
  };

  const handleDelete = async (id: string) => {
    setSaving((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/admin/publicite/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Échec de la suppression");
      setPublicites((prev) => prev.filter((p) => p.id !== id));
      toast.success("Annonce supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filtered = publicites.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
    }
    return true;
  }).filter((p) => {
    if (filterStatus !== "all") return p.status === filterStatus;
    return true;
  }).filter((p) => {
    if (filterSlot !== "all") return p.slot === filterSlot;
    return true;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const imageUrl = (img: string | null) => {
    if (!img) return null;
    return img.startsWith("data:") || img.startsWith("http") ? img : null;
  };

  // Contenu des modales
  const getDialogConfig = () => {
    if (!selectedItem) return { title: "", description: "", confirmLabel: "", confirmVariant: "default" as const };
    
    switch (dialogAction) {
      case "delete":
        return {
          title: "Supprimer cette publicité ?",
          description: `Êtes-vous sûr de vouloir supprimer « ${selectedItem.title} » ? Cette action est irréversible.`,
          confirmLabel: "Oui, supprimer",
          confirmVariant: "destructive" as const,
        };
      case "status":
        const isActive = selectedItem.status === "active";
        return {
          title: isActive ? "Désactiver cette publicité ?" : "Activer cette publicité ?",
          description: isActive
            ? `L'annonce « ${selectedItem.title} » ne sera plus diffusée sur le site.`
            : `L'annonce « ${selectedItem.title} » sera diffusée selon ses dates de programmation.`,
          confirmLabel: isActive ? "Oui, désactiver" : "Oui, activer",
          confirmVariant: isActive ? "destructive" : "default",
        };
      case "suspend":
        const isSuspended = selectedItem.status === "suspended";
        return {
          title: isSuspended ? "Reprendre la diffusion ?" : "Suspendre la diffusion ?",
          description: isSuspended
            ? `La diffusion de « ${selectedItem.title} » reprendra immédiatement.`
            : `La diffusion de « ${selectedItem.title} » sera mise en pause.`,
          confirmLabel: isSuspended ? "Oui, reprendre" : "Oui, suspendre",
          confirmVariant: isSuspended ? "default" : "destructive",
        };
      default:
        return { title: "", description: "", confirmLabel: "", confirmVariant: "default" as const };
    }
  };

  const dialogConfig = getDialogConfig();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Annonces & publicités"
        subtitle="Créez, modifiez et suivez les annonces publicitaires affichées sur le site"
        icon={<Truck className="size-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/admin/publicite/nouvelle">
              <Button>
                <Plus className="size-4 mr-2" /> Nouvelle annonce
              </Button>
            </Link>
            <Link href="/dashboard/admin">
              <Button variant="outline">
                <ArrowLeft className="size-4 mr-2" /> Retour
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <AlertCircle className="size-4 mr-2 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gestion des annonces</CardTitle>
          <CardDescription>
            Toutes les annonces configurées dans Neon, avec leurs emplacements et dates de diffusion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="scheduled">Programmée</SelectItem>
                <SelectItem value="active">En cours</SelectItem>
                <SelectItem value="expired">Terminée</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSlot} onValueChange={setFilterSlot} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les emplacements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les emplacements</SelectItem>
                <SelectItem value="home_hero">Accueil — sous bannière</SelectItem>
                <SelectItem value="home_search">Accueil — au-dessus de « Trouver mon Gaz »</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Aperçu</th>
                  <th className="text-left py-3 px-4">Titre</th>
                  <th className="text-left py-3 px-4">Emplacement</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Diffusion</th>
                  <th className="text-left py-3 px-4">Créée le</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-muted-foreground">
                      Aucune annonce trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg overflow-hidden border border-border flex items-center justify-center bg-muted">
                            {imageUrl(p.image) ? (
                              <img src={imageUrl(p.image)} alt="Aperçu" className="size-10 object-cover" />
                            ) : (
                              <Image className="size-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <p className="font-medium text-foreground">{p.title}</p>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {slotLabels[p.slot] ?? p.slot}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === "active" ? "default" : p.status === "suspended" ? "secondary" : "outline"}>
                          {statusLabels[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(p.startAt)} — {formatDate(p.endAt)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Bouton Suspendre/Reprendre avec modal */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog("suspend", p)}
                            disabled={saving.has(p.id) || p.status === "draft" || p.status === "expired" || dialogLoading}
                            title={p.status === "suspended" ? "Reprendre la diffusion" : "Suspendre la diffusion"}
                          >
                            {p.status === "suspended" ? <Play className="size-4" /> : <Pause className="size-4" />}
                          </Button>
                          {/* Lien vers page de modification */}
                          <Link href={`/dashboard/admin/publicite/${p.id}/modifier`}>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={saving.has(p.id)}
                            >
                              <Edit2 className="size-4" />
                            </Button>
                          </Link>
                          {/* Bouton Supprimer avec modal */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDialog("delete", p)}
                            disabled={saving.has(p.id) || dialogLoading}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modales de confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        confirmVariant={dialogConfig.confirmVariant}
        onConfirm={executeAction}
        isLoading={dialogLoading}
      />

      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        confirmVariant={dialogConfig.confirmVariant}
        onConfirm={executeAction}
        isLoading={dialogLoading}
      />

      <ConfirmDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        confirmVariant={dialogConfig.confirmVariant}
        onConfirm={executeAction}
        isLoading={dialogLoading}
      />
    </div>
  );
}