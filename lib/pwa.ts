/**
 * PWA utilities and type definitions.
 */

export interface ServiceWorkerRegistrationOptions {
  scope: string
  type?: "classic" | "module"
  scriptUrl?: string
}

export interface ServiceWorkerState {
  active: boolean
  installing: boolean
  waiting: boolean
  updatefound: boolean
  controller?: globalThis.ServiceWorker
  error?: boolean
}

declare global {
  interface Navigator {
    readonly devMenu: boolean
  }
}

/** Check if PWA service worker is available. */
export function hasServiceWorker(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator
}

/** Register the app's service worker. Returns a promise resolving on success. */
export async function registerServiceWorker(
  scriptUrl: string = "/sw.js",
  options?: Omit<ServiceWorkerRegistrationOptions, "scriptUrl">,
): Promise<ServiceWorkerRegistration> {
  if (!hasServiceWorker()) {
    throw new Error("Service worker not supported")
  }
  return navigator.serviceWorker.register(scriptUrl, options)
}

/** Show the native install prompt if available. */
export function promptInstall(): boolean {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false
  const w = navigator.serviceWorker
  if (!w?.controller) return false
  if (w.controller.state === "activated") {
    if ("onLine" in navigator) return true
    return typeof Notification !== "undefined" && Notification.permission === "granted"
  }
  return false
}
