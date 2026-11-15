"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Package,
  Shield,
  AlertCircle,
  Check,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
  Archive,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type NotificationItemType = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  link?: string | null;
  createdAt: string;
};

type NotificationItemProps = {
  notification: NotificationItemType;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
};

const TYPE_ICONS: Record<string, any> = {
  reservation: Calendar,
  availability: Package,
  system: Shield,
  promo: AlertCircle,
  admin: Bell,
};

const TYPE_LABELS: Record<string, string> = {
  reservation: "Réservation",
  availability: "Disponibilité",
  system: "Système",
  promo: "Promotion",
  admin: "Administration",
};

export function NotificationItem({
  notification,
  onUpdate,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const TypeIcon = TYPE_ICONS[notification.type] || Bell;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleMarkRead = async () => {
    if (!notification.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id, read: true }),
      });
      onUpdate(notification.id);
    }
  };

  const handleMarkUnread = async () => {
    if (notification.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id, read: false }),
      });
      onUpdate(notification.id);
    }
  };

  const handleArchive = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id, archived: true }),
    });
    onUpdate(notification.id);
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement cette notification ?")) return;
    await fetch(`/api/notifications/${notification.id}`, {
      method: "DELETE",
    });
    onDelete(notification.id);
  };

  const handleOpen = async () => {
    // Marquer comme lue à l'ouverture
    if (!notification.read) {
      await handleMarkRead();
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div className="group border border-border rounded-lg shadow-sm transition-all hover:shadow-sm">
      <div
        className={cn(
          "flex items-start gap-4 p-4 cursor-pointer",
          notification.read ? "" : "border-l-2 border-l-primary bg-primary/5"
        )}
        onClick={handleOpen}
      >
        {/* Indicateur lu/non lu */}
        {!notification.read && (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-0.5">
            <Check className="size-2.5" />
          </div>
        )}
        {notification.read && (
          <div className="flex size-5 shrink-0 items-center justify-center mt-0.5">
            <CheckCircle2 className="size-2.5 text-muted-foreground" />
          </div>
        )}

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TypeIcon className="size-4" />
              </div>
              <div>
                <h3 className={cn("font-medium text-foreground", !notification.read && "font-bold")}>
                  {notification.title}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[notification.type] || notification.type}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {formatDate(notification.createdAt)}
            </p>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Menu d'actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Actions de la notification"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!notification.read ? (
              <DropdownMenuItem onClick={handleMarkRead}>
                <Check className="size-3 mr-2" />
                Marquer comme lue
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleMarkUnread}>
                <EyeOff className="size-3 mr-2" />
                Marquer comme non lue
              </DropdownMenuItem>
            )}
            {!notification.archived ? (
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="size-3 mr-2" />
                Archiver
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleArchive}>
                <Eye className="size-3 mr-2" />
                Restaurer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="size-3 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
