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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";
import { dispatchNotificationsUpdated } from "@/lib/use-notification-unread-count";
import { AdminPageHeader, AdminCard } from "@/app/_components/dashboard/admin";
import {
  ClientRequestError,
  requestJson,
} from "@/lib/client-request";

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

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadControllerRef = useRef<AbortController | null>(null);

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

    if (showLoading) setLoading(true);
    setLoadError(null);

    try {
      const archivedParam = tab === "archived" ? "true" : "false";
      const data = await requestJson<{
        notifications?: Notification[];
        unreadCount?: number;
      }>(`/api/notifications?archived=${archivedParam}&limit=100`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount || 0));
      dispatchNotificationsUpdated();
    } catch (requestError) {
      if (
        controller.signal.aborted ||
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
  }, [tab]);

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      loadControllerRef.current?.abort();
    };
  }, [loadNotifications]);

  const syncAfterMutation = useCallback(async () => {
    await loadNotifications(false);
  }, [loadNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || target.read) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; id: string }>(
        "/api/notifications",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, read: true }),
        }
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((prev) =>
        target.archived ? prev : Math.max(0, prev - 1)
      );
      dispatchNotificationsUpdated();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de marquer la notification comme lue."
      );
    }
  }, [notifications]);

  const handleMarkUnread = useCallback(async (id: string) => {
    const target = notifications.find((notification) => notification.id === id);
    if (!target || !target.read) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; id: string }>(
        "/api/notifications",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, read: false }),
        }
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: false } : notification
        )
      );
      setUnreadCount((prev) => (target.archived ? prev : prev + 1));
      dispatchNotificationsUpdated();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de marquer la notification comme non lue."
      );
    }
  }, [notifications]);

  const handleArchive = useCallback(async (id: string) => {
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
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'archiver la notification."
      );
    }
  }, [syncAfterMutation]);

  const handleRestore = useCallback(async (id: string) => {
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
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de restaurer la notification."
      );
    }
  }, [syncAfterMutation]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette notification ?")) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; id: string }>(
        `/api/notifications/${id}`,
        { method: "DELETE" }
      );
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      await syncAfterMutation();
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de supprimer la notification."
      );
    }
  }, [syncAfterMutation]);

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
    const unreadIds = notifications
      .filter((notification) => !notification.read && !notification.archived)
      .map((notification) => notification.id);
    if (unreadIds.length === 0) return;

    setActionError(null);
    try {
      await requestJson<{ ok: boolean; action: string; count: number }>(
        "/api/notifications/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark-read", ids: unreadIds }),
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

  const tabLabels: Record<Tab, string> = {
    all: "Toutes",
    unread: "Non lues",
    archived: "Archivées",
  };

  const tabCounts: Record<Tab, number> = {
    all: notifications.filter((n) => !n.archived).length,
    unread: notifications.filter((n) => !n.read && !n.archived).length,
    archived: notifications.filter((n) => n.archived).length,
  };

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
      <AdminPageHeader
        title="Notifications"
        subtitle="Gérez vos notifications et alertes GazPoints"
        icon={<Bell className="size-5" />}
        actions={
          unreadCount > 0 && !bulkMode && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-sm">
              <Check className="size-3 mr-1" />
              Tout marquer comme lu
            </Button>
          )
        }
      />

      {(loadError || actionError) && (
        <div role="alert">
          <AdminCard className="border-destructive/30 bg-destructive/5">
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
                onClick={() => void loadNotifications(false)}
              >
                <RefreshCw className="mr-2 size-3" aria-hidden />
                Réessayer
              </Button>
            </div>
          </AdminCard>
        </div>
      )}

      {bulkMode && (
        <AdminCard className="border-green-200 bg-green-50">
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
        </AdminCard>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 admin-input"
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
          <AdminCard className="text-center py-12">
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
          </AdminCard>
          )
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                selected={selectedIds.includes(n.id)}
                onSelectChange={(id) => toggleSelect(id)}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}