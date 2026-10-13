"use client";

import { useEffect, useRef, useCallback } from "react";

interface TurnstileProps {
  /** Callback when the token is ready */
  onVerify: (token: string) => void;
  /** Callback when the token expires */
  onExpire?: () => void;
  /** Callback when there's an error */
  onError?: () => void;
  /** The action name for the challenge */
  action?: string;
  /** Theme: 'light' | 'dark' | 'auto' */
  theme?: "light" | "dark" | "auto";
  /** Tab index for accessibility */
  tabIndex?: number;
  /** Custom container className */
  className?: string;
}

export function Turnstile({
  onVerify,
  onExpire,
  onError,
  action = "inscription",
  theme = "auto",
  tabIndex = 0,
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  const remove = useCallback(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
  }, []);

  // Render the widget
  useEffect(() => {
    if (!containerRef.current || !siteKey || !window.turnstile) {
      return;
    }

    // Remove existing widget if any
    if (widgetIdRef.current !== null) {
      window.turnstile.remove(widgetIdRef.current);
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      action,
      tabIndex,
      callback: (token: string) => {
        onVerify(token);
      },
      "expired-callback": () => {
        onExpire?.();
      },
      "error-callback": () => {
        onError?.();
      },
    });

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, action, tabIndex, onVerify, onExpire, onError]);

  // Load the Turnstile script
  useEffect(() => {
    if (window.turnstile) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Don't remove script as it may be used by other components
    };
  }, []);

  if (!siteKey) {
    return (
      <div
        className={`p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm ${className}`}
        role="alert"
      >
        Turnstile site key not configured. Please set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}

// Type augmentation for window.turnstile
declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        theme?: "light" | "dark" | "auto";
        action?: string;
        tabIndex?: number;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => number;
      reset: (widgetId: number) => void;
      remove: (widgetId: number) => void;
      getResponse: (widgetId: number) => string;
    };
  }
}