"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  ChevronRight,
  Check,
  Clock,
  Mail,
  Shield,
  AlertCircle,
  Package,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotificationDetail = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  link?: string | null;
  createdAt: string;
};

type NotificationDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: NotificationDetail;
  onMarkRead: (id: string) => void;
};

const TYPE_ICONS: Record<string, any> = {
  reservation: Calendar,
  availability: Package,
  system: Shield,
  promo: AlertCircle,
  admin: Bell,
  mail: Mail,
};

const TYPE_LABELS: Record<string, string> = {
  reservation: "Réservation",
  availability: "Disponibilité",
  system: "Système",
  promo: "Promotion",
  admin: "Administration",
};

export function NotificationDetailDialog({
  open,
  onOpenChange,
  notification,
  onMarkRead,
}: NotificationDetailDialogProps) {
  const TypeIcon = TYPE_ICONS[notification.type] || Bell;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleMarkRead = async () => {
    if (!notification.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id, read: true }),
      });
      onMarkRead(notification.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TypeIcon className="size-4" />
            </div>
            <div>
              <DialogTitle>{notification.title}</DialogTitle>
              <DialogDescription>
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[notification.type] || notification.type}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs ml-2",
                    notification.read ? "bg-green-50 text-green-700 border-green-100" : "bg-blue-50 text-blue-700 border-blue-100"
                  )}
                >
                  {notification.read ? "Lu" : "Non lu"}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {formatDate(notification.createdAt)}
          </p>
          <p className="text-lg text-foreground leading-relaxed">
            {notification.message}
          </p>
          {notification.link && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Accéder à :
              </p>
              <Link
                href={notification.link}
                className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                <ChevronRight className="size-3.5" /> Voir la page concernée
              </Link>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              handleMarkRead();
              onOpenChange(false);
            }}
            className="w-full"
          >
            {!notification.read ? (
              <>
                <Check className="size-3 mr-1" />
                Marquer comme lu et fermer
              </>
            ) : (
              "Fermer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
