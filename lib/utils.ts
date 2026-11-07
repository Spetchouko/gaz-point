export { cn } from "cn"

export function safeRedirect(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value) return fallback
  if (!value.startsWith("/") || value.startsWith("//")) return fallback
  return value
}
