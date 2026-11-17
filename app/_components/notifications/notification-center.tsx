"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Filter,
  Search,
  Trash2,
  Archive,
  Eye,
  Inbox,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";

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

type NotificationCenterProps = {
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
};

export function NotificationCenter({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [tab, setTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Notifications filtrées selon l'onglet et la recherche
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (tab === "unread" && n.read) return false;
        if (tab === "archived" && !n.archived) return false;
        if (tab === "all" && n.archived) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [notifications, tab, searchQuery]);

  const isAllSelected = useMemo(
    () =>
      filteredNotifications.length > 0 &&
      filteredNotifications.every((n) => selectedIds.includes(n.id)),
    [filteredNotifications, selectedIds]
  );

  const someSelected = selectedIds.length > 0;

  // Charger les notifications depuis l'API
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?archived=false&limit=100`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Échec du chargement");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // En cas d'erreur, garder les notifications en local
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mettre à jour une notification après action
  const handleUpdate = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  }, []);

  const removeNotificationFromState = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const n = notifications.find((x) => x.id === id);
      return n && !n.read ? Math.max(0, prev - 1) : prev;
    });
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  }, [notifications]);

  // Action unique : marquer comme lue
  const handleMarkRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    handleUpdate(id);
  };

  // Action unique : marquer comme non lue
  const handleMarkUnread = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: false }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n))
    );
    setUnreadCount((prev) => prev + 1);
  };

  // Action unique : archiver
  const handleArchive = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: true }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const n = notifications.find((x) => x.id === id);
      return n && !n.read ? Math.max(0, prev - 1) : prev;
    });
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  // Action unique : supprimer
  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette notification ?")) return;
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    removeNotificationFromState(id);
  };

  // Action unique : restaurer (depuis archivé)
  const handleRestore = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: false }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
  };

  // Sélection/désélection individuelle
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Sélectionner tout / rien
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  // Action groupée : archiver les sélectionnées
  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Archiver ${selectedIds.length} notification(s) ?`)) return;
    await fetch("/api/notifications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive", ids: selectedIds }),
    });
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setUnreadCount((prev) => {
      const removedUnread = notifications.filter(
        (n) => selectedIds.includes(n.id) && !n.read
      ).length;
      return Math.max(0, prev - removedUnread);
    });
    setSelectedIds([]);
    setBulkMode(false);
  };

  // Action groupée : supprimer les sélectionnées
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Supprimer définitivement ${selectedIds.length} notification(s) ?`
      )
    )
      return;
    await fetch("/api/notifications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: selectedIds }),
    });
    setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
    setUnreadCount((prev) => {
      const removedUnread = notifications.filter(
        (n) => selectedIds.includes(n.id) && !n.read
      ).length;
      return Math.max(0, prev - removedUnread);
    });
    setSelectedIds([]);
    setBulkMode(false);
  };

  // Action groupée : tout marquer comme lu
  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await fetch("/api/notifications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-read", ids: unreadIds }),
    });
    setNotifications((prev) =>
      prev.map((n) => (!n.read ? { ...n, read: true } : n))
    );
    setUnreadCount(0);
    setSelectedIds([]);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle2 className="size-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Gérez vos notifications et alertes GazPoints
          </p>
        </div>

        {unreadCount > 0 && !bulkMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-sm"
          >
            <Check className="size-3 mr-1" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Sélection multiple (bulk mode) */}
      {bulkMode && (
        <Card className="border border-border shadow-sm rounded-lg bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.length} notification(s) sélectionnée(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkArchive}
                  className="text-xs px-2"
                >
                  <Archive className="size-3 mr-1" />
                  Archiver
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-xs px-2"
                >
                  <Trash2 className="size-3 mr-1" />
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkMode(false)}
                  className="text-xs px-2 text-muted-foreground"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {["all", "unread", "archived"].map((t) => {
          const isActive = tab === t;
          return (
            <Button
              key={t}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setTab(t as Tab);
                setSelectedIds([]);
                setBulkMode(false);
              }}
              className={cn(
                "text-sm overflow-hidden overflow-ellipsis whitespace-nowrap",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              {t === "all" && <Inbox className="size-3 mr-1.5" />}
              {t === "unread" && <Bell className="size-3 mr-1.5" />}
              {t === "archived" && <Archive className="size-3 mr-1.5" />}
              {tabLabels[t as Tab]}
              {tabCounts[t as Tab as keyof typeof tabCounts] > 0 && (
                <Badge variant="outline" className="ml-1 h-5 w-5 px-1.5 text-[10px]">
                  {tabCounts[t as Tab as keyof typeof tabCounts]}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Recherche et actions en vrac */}
      {!bulkMode && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les notifications…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {someSelected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedIds.length} sélectionné(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkMode(true)}
              >
                Actions groupées
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="text-muted-foreground"
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Liste des notifications */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card className="border border-border shadow-sm rounded-lg">
            <CardContent className="py-12 text-center">
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
                    : searchQuery
                    ? "Essayez d'autres termes de recherche."
                    : tab === "unread"
                    ? "Toutes vos notifications ont été lues."
                    : "Vous n'avez aucune notification pour le moment."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
