export type Theme = "light" | "dark" | "system"

const listeners = new Set<() => void>()

function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem("gaz-theme")
    if (raw === "light" || raw === "dark" || raw === "system") return raw
  } catch {}
  return "system"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  root.classList.toggle(
    "dark",
    theme === "dark" || (theme === "system" && prefersDark)
  )
}

function notify() {
  listeners.forEach((listener) => listener())
}

// Snapshot client : useSyncExternalStore le lit après l'hydratation.
export function getThemeSnapshot(): Theme {
  return getStoredTheme()
}

// Snapshot serveur : constant, identique côté serveur et pendant l'hydratation.
export function getServerThemeSnapshot(): Theme {
  return "system"
}

export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange)

  const mql = window.matchMedia("(prefers-color-scheme: dark)")
  const handleChange = () => {
    applyTheme(getStoredTheme())
    notify()
  }
  mql.addEventListener("change", handleChange)
  window.addEventListener("storage", handleChange)

  return () => {
    listeners.delete(onChange)
    mql.removeEventListener("change", handleChange)
    window.removeEventListener("storage", handleChange)
  }
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem("gaz-theme", theme)
  } catch {}
  applyTheme(theme)
  notify()
}
