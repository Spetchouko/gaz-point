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
  controller?: ServiceWorker
  error?: boolean
}

export interface ServiceWorker extends EventTarget {
  readonly state: ServiceWorkerState
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: ServiceWorker, ev: WorkerEventMap[K]) => unknown,
    options?: AddEventListenerOptions | boolean,
  ): void
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: ServiceWorker, ev: WorkerEventMap[K]) => unknown,
    options?: boolean,
  ): void
  postMessage(message: any, transfer?: Transferable[]): void
  readonly controller: ServiceWorker | null
  addEventListener(type: "message", listener: ((ev: MessageEvent) => unknown)): void
  removeEventListener(type: "message", listener: ((ev: MessageEvent) => unknown)): void
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
  const w = typeof navigator !== "undefined" ? navigator.serviceWorker : undefined
  if (!w?.controller) return false
  if (String(w.controller?.state) === "active") {
    if ("onLine" in navigator) return true
    return typeof Notification !== "undefined" && Notification.permission === "granted"
  }
  return false
}
