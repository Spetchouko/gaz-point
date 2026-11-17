export type Theme = "light" | "dark" | "system"

function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem("gaz-theme")
    if (raw === "light" || raw === "dark" || raw === "system") return raw
  } catch {}
  return "system"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  } else if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function initTheme() {
  const theme = getStoredTheme()
  applyTheme(theme)
  const mql = window.matchMedia("(prefers-color-scheme: dark)")
  const listener = () => {
    if (getStoredTheme() === "system") applyTheme("system")
  }
  mql.addEventListener("change", listener)
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem("gaz-theme", theme)
  } catch {}
  applyTheme(theme)
}
