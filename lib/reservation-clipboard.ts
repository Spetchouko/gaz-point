type ClipboardWriter = {
  writeText: (text: string) => Promise<void> | void
}

/**
 * Copie le code de réservation dans le presse-papiers.
 * Retourne `false` si le navigateur ne permet pas l'opération, afin que
 * l'interface affiche une erreur au lieu de prétendre que la copie a réussi.
 */
export async function copyReservationCode(
  code: string,
  clipboard?: ClipboardWriter
): Promise<boolean> {
  const target =
    clipboard ??
    (typeof navigator !== "undefined" ? navigator.clipboard : undefined)

  if (!target || !code) return false

  try {
    await target.writeText(code)
    return true
  } catch {
    return false
  }
}
