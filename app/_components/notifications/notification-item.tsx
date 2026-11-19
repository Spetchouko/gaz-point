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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AdminCard, AdminBadge } from "@/app/_components/dashboard/admin";

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
  selected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
  onMarkRead: (id: string) => Promise<void> | void;
  onMarkUnread: (id: string) => Promise<void> | void;
  onArchive: (id: string) => Promise<void> | void;
  onRestore: (id: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
  selected = false,
  onSelectChange,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onRestore,
  onDelete,
}: NotificationItemProps) {
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

  const handleOpen = async () => {
    if (!notification.read) {
      await onMarkRead(notification.id);
    }
  };

  return (
    <AdminCard
      className={cn(
        "group transition-all hover:shadow-md",
        selected && "border-green-300 bg-green-50",
        !notification.read && "border-l-2 border-l-green-600 bg-green-50/50",
        notification.archived && "opacity-70"
      )}
      hover={false}
    >
      <div className="flex items-start gap-3 p-4">
        {onSelectChange && (
          <div className="flex shrink-0 items-center pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelectChange(notification.id, e.target.checked)}
              className="accent-green-600 h-4 w-4 rounded border-border"
              aria-label={`Sélectionner ${notification.title}`}
            />
          </div>
        )}

        <div className="flex-1 min-w-0" onClick={handleOpen}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <TypeIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn("font-medium text-foreground", !notification.read && "font-semibold")}>
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <AdminBadge variant="primary" className="text-[10px]">
                      Non lue
                    </AdminBadge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <AdminBadge variant="neutral" className="text-xs">
                    {TYPE_LABELS[notification.type] || notification.type}
                  </AdminBadge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-muted-foreground hover:text-green-700 transition-colors"
                  aria-label="Actions de la notification"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      void onMarkRead(notification.id);
                    }}
                  >
                    <Check className="size-3 mr-2" />
                    Marquer comme lue
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      void onMarkUnread(notification.id);
                    }}
                  >
                    <EyeOff className="size-3 mr-2" />
                    Marquer comme non lue
                  </DropdownMenuItem>
                )}
                {!notification.archived ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      void onArchive(notification.id);
                    }}
                  >
                    <Archive className="size-3 mr-2" />
                    Archiver
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      void onRestore(notification.id);
                    }}
                  >
                    <Eye className="size-3 mr-2" />
                    Restaurer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDelete(notification.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="size-3 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {notification.link ? (
              <Link
                href={notification.link}
                onClick={handleOpen}
                className="text-xs font-medium text-green-700 hover:underline"
              >
                Voir l'élément lié →
              </Link>
            ) : null}
            {!notification.read ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void onMarkRead(notification.id);
                }}
                className="text-xs text-muted-foreground hover:text-green-700"
              >
                Marquer comme lue
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3" /> Lue
              </span>
            )}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}
