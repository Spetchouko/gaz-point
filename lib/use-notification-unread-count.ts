"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated";

/**
 * Configuration pour le polling des notifications.
 */
const POLLING_INTERVAL_MS = 60_000; // 60 secondes (au lieu de 30)
const FOCUS_DEBOUNCE_MS = 5_000; // 5 secondes anti-rebond sur focus
const VISIBILITY_DEBOUNCE_MS = 2_000; // 2 secondes sur changement visibilité

/**
 * Source unique du nombre de notifications non lues de l'utilisateur connecté.
 * Optimisé : polling 60s, debounce sur focus/visibilité, annulation requêtes en cours.
 */
export function useNotificationUnreadCount(enabled = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const requestSequenceRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const lastFocusRefreshRef = useRef(0);
  const lastVisibilityRefreshRef = useRef(0);

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

  const debouncedRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastFocusRefreshRef.current >= FOCUS_DEBOUNCE_MS) {
      lastFocusRefreshRef.current = now;
      void refresh();
    }
  }, [refresh]);

  const debouncedVisibilityRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastVisibilityRefreshRef.current >= VISIBILITY_DEBOUNCE_MS) {
      lastVisibilityRefreshRef.current = now;
      void refresh();
    }
  }, [refresh]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    void refresh();

    const onUpdated = () => {
      void refresh();
    };

    const onFocus = () => {
      debouncedRefresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        debouncedVisibilityRefresh();
      }
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      void refresh();
    }, POLLING_INTERVAL_MS);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [enabled, refresh, debouncedRefresh, debouncedVisibilityRefresh]);

  return { unreadCount, refresh };
}

export function dispatchNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  }
}