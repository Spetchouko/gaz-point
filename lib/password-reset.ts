import { createHash } from "node:crypto"

export const PASSWORD_RESET_TOKEN_PREFIX = "password-reset-"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizePasswordResetToken(value: unknown): string | null {
  if (typeof value !== "string") return null

  const token = value.trim().toLowerCase()
  if (!UUID_PATTERN.test(token)) return null

  return token
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function getPasswordResetTokenIdentifier(token: string): string {
  return `${PASSWORD_RESET_TOKEN_PREFIX}${hashPasswordResetToken(token)}`
}

export function getLegacyPasswordResetTokenIdentifier(token: string): string {
  return `${PASSWORD_RESET_TOKEN_PREFIX}${token}`
}

export function getPasswordResetTokenIdentifiers(token: string): string[] {
  return [
    getPasswordResetTokenIdentifier(token),
    getLegacyPasswordResetTokenIdentifier(token),
  ]
}
