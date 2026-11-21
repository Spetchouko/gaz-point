"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated";

/**
 * Source unique du nombre de notifications non lues de l'utilisateur connecté.
 * Lit /api/notifications (même source que le centre de notifications) et se
 * synchronise après chaque mutation (lecture/suppression/archivage/création)
 * via l'événement notifications:updated, au retour de focus/visibilité, au
 * reconnect et par polling léger.
 */
export function useNotificationUnreadCount(enabled = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const requestSequenceRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const sequence = ++requestSequenceRef.current;

    try {
      const res = await fetch("/api/notifications?archived=false&limit=1", {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok || sequence !== requestSequenceRef.current) return;
      const data = await res.json();
      if (sequence !== requestSequenceRef.current) return;
      const count = Number(data?.unreadCount ?? 0);
      setUnreadCount(Number.isFinite(count) && count > 0 ? count : 0);
    } catch {
      // Ne pas afficher de compteur fictif en cas d'erreur réseau.
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    void refresh();

    const onUpdated = () => {
      void refresh();
    };
    const onFocus = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [enabled, refresh]);

  return { unreadCount, refresh };
}

export function dispatchNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  }
}
