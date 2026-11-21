export const MIN_PASSWORD_LENGTH = 8

export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== "string" || !password) {
    return "Le mot de passe est requis."
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  }

  return null
}
