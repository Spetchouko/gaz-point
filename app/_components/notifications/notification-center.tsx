"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Search,
  Trash2,
  Archive,
  Inbox,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";
import Link from "next/link";
import { dispatchNotificationsUpdated } from "@/lib/use-notification-unread-count";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClientRequestError,
  requestJson,
} from "@/lib/client-request";
import { buildCsv, downloadCsv } from "@/lib/csv-export";
import { toast } from "sonner";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  link?: string | null;
  createdAt: string;
};

type Tab = "all" | "unread" | "archived";

type NotificationPagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type NotificationResponse = {
  notifications?: Notification[];
  unreadCount?: number;
  counts?: Record<Tab, number>;
  pagination?: NotificationPagination;
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [counts, setCounts] = useState<Record<Tab, number>>({
    all: 0,
    unread: 0,
    archived: 0,
  });
  const [pagination, setPagination] = useState<NotificationPagination>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [tab, setTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!detailNotification) return;
    const updated = notifications.find((n) => n.id === detailNotification.id);
    if (updated) setDetailNotification(updated);
  }, [notifications, detailNotification?.id]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const loadControllerRef = useRef<AbortController | null>(null);
  const loadSequenceRef = useRef(0);
  const mutationSequenceRef = useRef(0);
  const mutationVersionsRef = useRef<Map<string, number>>(new Map());
  const pendingIdsRef = useRef<Set<string>>(new Set());

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (tab === "unread" && (n.read || n.archived)) return false;
        if (tab === "archived" && !n.archived) return false;
        if (tab === "all" && n.archived) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            n.message.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [notifications, tab, searchQuery]);

  const loadNotifications = useCallback(async (showLoading = true) => {
    // Laisse l'effet terminer sa phase de synchronisation avant de modifier
    // l'état. Cela évite un rendu en cascade tout en conservant le chargement.
    await Promise.resolve()

    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    const sequence = ++loadSequenceRef.current;

    if (showLoading) setLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      params.set("archived", tab === "archived" ? "true" : "false");
      if (tab === "unread") params.set("read", "false");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", String(page));
      params.set("pageSize", "20");

      const data = await requestJson<NotificationResponse>(
        `/api/notifications?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (
        controller.signal.aborted ||
        sequence !== loadSequenceRef.current
      ) {
        return;
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
      if (data.counts) setCounts(data.counts);
      if (data.pagination) setPagination(data.pagination);
      dispatchNotificationsUpdated();
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        sequence !== loadSequenceRef.current ||
        (requestError instanceof ClientRequestError &&
          requestError.kind === "aborted")
      ) {
        return;
      }

      setLoadError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les notifications. Réessayez."
      );
    } finally {
      if (loadControllerRef.current === controller) {
        if (showLoading) setLoading(false);
        loadControllerRef.current = null;
      }
    }
  }, [page, searchQuery, tab]);

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      loadControllerRef.current?.abort();
    };
  }, [loadNotifications]);

  // La page et la sélection sont réinitialisées directement dans les
  // gestionnaires de recherche et d'onglet : aucun setState dans un effet.

  const syncAfterMutation = useCallback(async () => {
    await loadNotifications(false);
  }, [loadNotifications]);

  const beginMutation = useCallback((id: string): number | false => {
    if (pendingIdsRef.current.has(id)) return false;

    const nextPending = new Set(pendingIdsRef.current);
    nextPending.add(id);
    pendingIdsRef.current = nextPending;
    setPendingIds(nextPending);

    const version = (mutationVersionsRef.current.get(id) ?? 0) + 1;
    mutationVersionsRef.current.set(id, version);
    loadControllerRef.current?.abort();
    mutationSequenceRef.current += 1;
    return version;
  }, []);

  const endMutation = useCallback((id: string) => {
    const nextPending = new Set(pendingIdsRef.current);
    nextPending.delete(id);
    pendingIdsRef.current = nextPending;
    setPendingIds(nextPending);
  }, []);

  const isCurrentMutation = useCallback((id: string, version: number) => {
    return mutationVersionsRef.current.get(id) === version;
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || target.read || pendingIdsRef.current.has(id)) return;

    const version = beginMutation(id);
    if (version === false) return;
    setActionError(null);
    try {
      const response = await requestJson<{
        ok: boolean;
        id: string;
        unreadCount?: number;
      }>(
        "/api/notifications",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, read: true }),
        }
      );
      if (!isCurrentMutation(id, version)) return;
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      const unreadCount = typeof response.unreadCount === "number" ? response.unreadCount : undefined;
      if (unreadCount !== undefined) {
        setUnreadCount(unreadCount);
      } else {
        setUnreadCount((prev) =>
          target.archived ? prev : Math.max(0, prev - 1)
        );
      }
      dispatchNotificationsUpdated();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de marquer la notification comme lue."
      );
    } finally {
      endMutation(id);
    }
  }, [beginMutation, endMutation, isCurrentMutation, notifications]);

  const handleMarkUnread = useCallback(async (id: string) => {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || !target.read || pendingIdsRef.current.has(id)) return;

    const version = beginMutation(id);
    if (version === false) return;
    setActionError(null);
    try {
      const response = await requestJson<{
        ok: boolean;
        id: string;
        unreadCount?: number;
      }>(
        "/api/notifications",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, read: false }),
        }
      );
      if (!isCurrentMutation(id, version)) return;
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: false } : notification
        )
      );
      const unreadCount = typeof response.unreadCount === "number" ? response.unreadCount : undefined;
      if (unreadCount !== undefined) {
        setUnreadCount(unreadCount);
      } else {
        setUnreadCount((prev) => (target.archived ? prev : prev + 1));
      }
      dispatchNotificationsUpdated();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de marquer la notification comme non lue."
      );
    } finally {
      endMutation(id);
    }
  }, [beginMutation, endMutation, isCurrentMutation, notifications]);

  const handleArchive = useCallback(async (id: string) => {
    if (pendingIdsRef.current.has(id)) return;
    const version = beginMutation(id);
    if (version === false) return;
    setActionError(null);
    try {
      await requestJson<{ ok: boolean; id: string }>(
        "/api/notifications",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, archived: true }),
        }
      );
      if (!isCurrentMutation(id, version)) return;
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'archiver la notification."
      );
    } finally {
      endMutation(id);
    }
  }, [beginMutation, endMutation, isCurrentMutation, syncAfterMutation]);

  const handleRestore = useCallback(async (id: string) => {
    if (pendingIdsRef.current.has(id)) return;
    const version = beginMutation(id);
    if (version === false) return;
    setActionError(null);
    try {
      await requestJson<{ ok: boolean; id: string }>(
        "/api/notifications",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, archived: false }),
        }
      );
      if (!isCurrentMutation(id, version)) return;
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de restaurer la notification."
      );
    } finally {
      endMutation(id);
    }
  }, [beginMutation, endMutation, isCurrentMutation, syncAfterMutation]);

  const handleDelete = useCallback(async (id: string) => {
    if (pendingIdsRef.current.has(id)) return;
    if (!window.confirm("Supprimer définitivement cette notification ?")) return;

    const version = beginMutation(id);
    if (version === false) return;
    setActionError(null);
    try {
      await requestJson<{ ok: boolean; id: string }>(
        `/api/notifications/${id}`,
        { method: "DELETE" }
      );
      if (!isCurrentMutation(id, version)) return;
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de supprimer la notification."
      );
    } finally {
      endMutation(id);
    }
  }, [beginMutation, endMutation, isCurrentMutation, syncAfterMutation]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (filteredNotifications.length === 0) return;
    const allSelected = filteredNotifications.every((n) => selectedIds.includes(n.id));
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filteredNotifications.map((n) => n.id));
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Archiver ${selectedIds.length} notification(s) ?`)) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; action: string; count: number }>(
        "/api/notifications/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "archive", ids: selectedIds }),
        }
      );
      setSelectedIds([]);
      setBulkMode(false);
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'archiver les notifications."
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Supprimer définitivement ${selectedIds.length} notification(s) ?`)) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; action: string; count: number }>(
        "/api/notifications/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids: selectedIds }),
        }
      );
      setSelectedIds([]);
      setBulkMode(false);
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de supprimer les notifications."
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (counts.unread === 0) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; action: string; count: number }>(
        "/api/notifications/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark-all-read" }),
        }
      );
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de marquer les notifications comme lues."
      );
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setActionError(null);
    try {
      const data = await requestJson<{ notifications?: Notification[] }>(
        "/api/notifications/export",
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      const csv = buildCsv(
        ["Type", "Titre", "Message", "Lien", "Lue", "Archivée", "Date"],
        rows.map((notification) => [
          notification.type,
          notification.title,
          notification.message,
          notification.link,
          notification.read ? "Oui" : "Non",
          notification.archived ? "Oui" : "Non",
          notification.createdAt,
        ])
      );
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`notifications-${date}.csv`, csv);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'exporter les notifications.";
      setActionError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const tabLabels: Record<Tab, string> = {
    all: "Toutes",
    unread: "Non lues",
    archived: "Archivées",
  };

  const tabCounts = counts;

  const someSelected = selectedIds.length > 0;
  const isAllSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.includes(n.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle2 className="size-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Bell className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez vos notifications et alertes GazPoints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="text-sm"
          >
            <Download className="size-3 mr-1" />
            {exporting ? "Export…" : "Exporter"}
          </Button>
          {unreadCount > 0 && !bulkMode && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-sm">
              <Check className="size-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {(loadError || actionError) && (
        <div role="alert">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                <p className="text-sm text-destructive">
                  {loadError || actionError}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  void loadNotifications(false);
                }}
              >
                <RefreshCw className="mr-2 size-3" aria-hidden />
                Réessayer
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {bulkMode && (
        <Card className="border-green-200 bg-green-50">
          <CardContent>
            <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} notification(s) sélectionnée(s)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkArchive} className="text-xs px-2">
                <Archive className="size-3 mr-1" />
                Archiver
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="text-xs px-2">
                <Trash2 className="size-3 mr-1" />
                Supprimer
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setBulkMode(false); setSelectedIds([]); }} className="text-xs px-2 text-muted-foreground">
                Annuler
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {(["all", "unread", "archived"] as const).map((t) => {
          const isActive = tab === t;
          return (
            <Button
              key={t}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTab(t);
                setPage(1);
                setSelectedIds([]);
                setBulkMode(false);
              }}
              className={cn("text-sm", isActive && "bg-primary text-primary-foreground")}
            >
              {t === "all" && <Inbox className="size-3 mr-1.5" />}
              {t === "unread" && <Bell className="size-3 mr-1.5" />}
              {t === "archived" && <Archive className="size-3 mr-1.5" />}
              {tabLabels[t]}
              {tabCounts[t] > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
                  {tabCounts[t]}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {!bulkMode && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les notifications…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
                setSelectedIds([]);
              }}
              className="pl-12 admin-input"
            />
          </div>
          <div className="flex items-center gap-2">
            {filteredNotifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
            )}
            {someSelected && (
              <Button variant="outline" size="sm" onClick={() => setBulkMode(true)}>
                Actions groupées ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      )}

      <Separator className="admin-separator" />

      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          loadError ? null : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-2">
              {tab === "archived" ? (
                <Archive className="size-12 mx-auto text-muted-foreground/50" />
              ) : (
                <Bell className="size-12 mx-auto text-muted-foreground/50" />
              )}
              <h3 className="mt-3 font-semibold">
                {tab === "archived"
                  ? "Aucune notification archivée"
                  : searchQuery
                  ? "Aucune notification ne correspond à votre recherche"
                  : tab === "unread"
                  ? "Aucune notification non lue"
                  : "Aucune notification pour le moment"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "archived"
                  ? "Les notifications archivées s'afficheront ici."
                  : tab === "unread"
                  ? "Toutes vos notifications ont été lues."
                  : "Vous n'avez aucune notification pour le moment."}
              </p>
              </div>
            </CardContent>
          </Card>
          )
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                pending={pendingIds.has(n.id)}
                selected={selectedIds.includes(n.id)}
                onSelectChange={(id) => toggleSelect(id)}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
                onOpen={(item) => setDetailNotification(item)}
              />
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} sur {pagination.totalPages} · {pagination.total} notification{pagination.total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="size-4" /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page >= pagination.totalPages || loading}
              >
                Suivant <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!detailNotification}
        onOpenChange={(open) => !open && setDetailNotification(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailNotification?.title || "Notification"}</DialogTitle>
            <DialogDescription>
              {detailNotification
                ? `Reçue le ${new Date(detailNotification.createdAt).toLocaleString("fr-FR")}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {detailNotification && (
            <div className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap text-foreground">
                {detailNotification.message}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>Type: {detailNotification.type}</span>
                <span>•</span>
                <span>{detailNotification.read ? "Lue" : "Non lue"}</span>
                {detailNotification.archived ? <span>• Archivée</span> : null}
              </div>
              {detailNotification.link ? (
                <Link
                  href={detailNotification.link}
                  className="inline-flex text-sm font-medium text-green-700 hover:underline"
                  onClick={() => setDetailNotification(null)}
                >
                  Accéder à l&apos;élément lié →
                </Link>
              ) : null}
            </div>
          )}
          <DialogFooter>
            {detailNotification && !detailNotification.read ? (
              <Button
                variant="outline"
                onClick={() => void handleMarkRead(detailNotification.id)}
              >
                Marquer comme lue
              </Button>
            ) : null}
            {detailNotification?.read ? (
              <Button
                variant="outline"
                onClick={() => void handleMarkUnread(detailNotification.id)}
              >
                Marquer comme non lue
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setDetailNotification(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}